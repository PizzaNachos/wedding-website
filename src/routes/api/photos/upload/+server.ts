import { json } from '@sveltejs/kit';
import { createServiceClient } from '$lib/supabase-server';
import { uploadImage, deleteImage } from '$lib/cloudflare-images';
import type { RequestHandler } from './$types';

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export const POST: RequestHandler = async ({ request }) => {
	const formData = await request.formData();
	const file = formData.get('file') as File | null;
	const guestId = formData.get('guest_id') as string | null;
	const customTagsRaw = (formData.get('custom_tags') as string) || '[]';

	// Validate file
	if (!file || !(file instanceof File)) {
		return json({ error: 'No file provided.' }, { status: 400 });
	}

	if (!file.type.startsWith('image/')) {
		return json({ error: 'Only image files are accepted.' }, { status: 400 });
	}

	if (file.size > MAX_SIZE) {
		return json({ error: 'File is too large. Maximum size is 10MB.' }, { status: 400 });
	}

	// Validate guest_id
	if (!guestId) {
		return json({ error: 'Guest identification is required.' }, { status: 400 });
	}

	const supabase = createServiceClient();

	const { data: guest } = await supabase
		.from('guests')
		.select('id')
		.eq('id', guestId)
		.single();

	if (!guest) {
		return json({ error: 'Invalid guest identifier.' }, { status: 400 });
	}

	// Parse custom tags
	let customTags: string[] = [];
	try {
		customTags = JSON.parse(customTagsRaw);
		if (!Array.isArray(customTags)) customTags = [];
	} catch {
		customTags = [];
	}

	// Upload to Cloudflare Images
	let cloudflareImageId: string;
	try {
		const result = await uploadImage(file);
		cloudflareImageId = result.id;
	} catch (err) {
		console.error('Cloudflare upload failed:', err);
		return json({ error: 'Failed to upload image. Please try again.' }, { status: 500 });
	}

	// Insert into database
	const { data: photoUpload, error: dbError } = await supabase
		.from('photo_uploads')
		.insert({
			cloudflare_image_id: cloudflareImageId,
			original_filename: file.name,
			uploader_guest_id: guestId,
			event_id: null,
			custom_tags: customTags,
			people_tags: [],
			status: 'pending'
		})
		.select('id')
		.single();

	if (dbError || !photoUpload) {
		// Clean up orphaned Cloudflare image
		console.error('DB insert failed:', dbError);
		try {
			await deleteImage(cloudflareImageId);
		} catch (cleanupErr) {
			console.error('Failed to clean up Cloudflare image:', cleanupErr);
		}
		return json({ error: 'Failed to save photo record. Please try again.' }, { status: 500 });
	}

	return json({ success: true, id: photoUpload.id });
};
