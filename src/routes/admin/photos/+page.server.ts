import { createServiceClient } from '$lib/supabase-server';
import { getImageUrl, deleteImage, uploadImage } from '$lib/cloudflare-images';
import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const supabase = createServiceClient();

	const statusFilter = url.searchParams.get('status') ?? 'pending';

	const { data: photos } = await supabase
		.from('photo_uploads')
		.select(
			'*, events(id, name), guests!uploader_guest_id(id, first_name, last_name)'
		)
		.eq('status', statusFilter)
		.order('uploaded_at', { ascending: false });

	console.log("Photos?", photos)

	const photoList = (photos ?? []).map((p: any) => ({
		...p,
		url: p.cloudflare_image_id
			? getImageUrl(p.cloudflare_image_id, 'thumbnail')
			: null,
		fullUrl: p.cloudflare_image_id
			? getImageUrl(p.cloudflare_image_id, 'full')
			: null,
		event_name: p.events?.name ?? null,
		uploader_name: p.guests
			? `${p.guests.first_name} ${p.guests.last_name}`
			: null
	}));
	console.log("PhotoList?", photoList)

	// Get counts for each status
	const [{ count: pendingCount }, { count: approvedCount }, { count: rejectedCount }] =
		await Promise.all([
			supabase
				.from('photo_uploads')
				.select('*', { count: 'exact', head: true })
				.eq('status', 'pending'),
			supabase
				.from('photo_uploads')
				.select('*', { count: 'exact', head: true })
				.eq('status', 'approved'),
			supabase
				.from('photo_uploads')
				.select('*', { count: 'exact', head: true })
				.eq('status', 'rejected')
		]);

	// Load events and guests for metadata editing dropdowns
	const { data: events } = await supabase
		.from('events')
		.select('id, name')
		.order('date', { ascending: true });

	const { data: guests } = await supabase
		.from('guests')
		.select('id, first_name, last_name')
		.order('last_name', { ascending: true });

	return {
		photos: photoList,
		statusFilter,
		counts: {
			pending: pendingCount ?? 0,
			approved: approvedCount ?? 0,
			rejected: rejectedCount ?? 0
		},
		events: events ?? [],
		guests: guests ?? []
	};
};

export const actions: Actions = {
	approve: async ({ request, locals }) => {
		const supabase = createServiceClient();
		const formData = await request.formData();
		const ids = formData.getAll('ids') as string[];

		if (!ids.length) return fail(400, { error: 'No photos selected.' });

		const { error } = await supabase
			.from('photo_uploads')
			.update({
				status: 'approved',
				reviewed_at: new Date().toISOString(),
				reviewed_by: locals.user?.id
			})
			.in('id', ids);

		if (error) return fail(500, { error: 'Failed to approve photos.' });

		return { success: true };
	},

	reject: async ({ request, locals }) => {
		const supabase = createServiceClient();
		const formData = await request.formData();
		const ids = formData.getAll('ids') as string[];

		if (!ids.length) return fail(400, { error: 'No photos selected.' });

		const { error } = await supabase
			.from('photo_uploads')
			.update({
				status: 'rejected',
				reviewed_at: new Date().toISOString(),
				reviewed_by: locals.user?.id
			})
			.in('id', ids);

		if (error) return fail(500, { error: 'Failed to reject photos.' });

		return { success: true };
	},

	delete: async ({ request }) => {
		const supabase = createServiceClient();
		const formData = await request.formData();
		const id = formData.get('id') as string;

		if (!id) return fail(400, { error: 'Photo ID is required.' });

		// Get the photo record for cleanup
		const { data: photo } = await supabase
			.from('photo_uploads')
			.select('cloudflare_image_id, storage_path')
			.eq('id', id)
			.single();

		if (photo) {
			// Delete from Cloudflare Images if applicable
			if (photo.cloudflare_image_id) {
				try {
					await deleteImage(photo.cloudflare_image_id);
				} catch (err) {
					console.error('Failed to delete from Cloudflare:', err);
				}
			}
			// Delete from Supabase Storage if legacy photo
			if (photo.storage_path) {
				await supabase.storage.from('photos').remove([photo.storage_path]);
			}
		}

		await supabase.from('photo_uploads').delete().eq('id', id);

		return { success: true };
	},

	upload: async ({ request, locals }) => {
		const supabase = createServiceClient();
		const formData = await request.formData();
		const files = formData.getAll('files') as File[];
		const category = (formData.get('category') as string) || null;
		const customTagsRaw = (formData.get('custom_tags') as string) || '[]';

		if (!files.length || !(files[0] instanceof File)) {
			return fail(400, { error: 'No files provided.' });
		}

		if (!category) {
			return fail(400, { error: 'Category is required for admin uploads.' });
		}

		let customTags: string[] = [];
		try {
			customTags = JSON.parse(customTagsRaw);
			if (!Array.isArray(customTags)) customTags = [];
		} catch {
			customTags = [];
		}

		const errors: string[] = [];
		for (const file of files) {

			if (!file.type.startsWith('image/')) {
				console.log("file.type", file.type)
				errors.push(`${file.name}: not an image`);
				continue;
			}

			let cloudflareImageId: string;
			try {
				const result = await uploadImage(file);
				cloudflareImageId = result.id;
			} catch (err) {
				console.error(`Cloudflare upload failed for ${file.name}:`, err);
				errors.push(`${file.name}: upload failed`);
				continue;
			}

			const { error: dbError } = await supabase.from('photo_uploads').insert({
				cloudflare_image_id: cloudflareImageId,
				original_filename: file.name,
				uploader_guest_id: null,
				event_id: null,
				category,
				custom_tags: customTags,
				people_tags: [],
				status: 'approved',
				source: 'admin',
				reviewed_at: new Date().toISOString(),
				reviewed_by: locals.user?.id
			});

			if (dbError) {
				console.error(`DB insert failed for ${file.name}:`, dbError);
				try {
					await deleteImage(cloudflareImageId);
				} catch (cleanupErr) {
					console.error('Failed to clean up Cloudflare image:', cleanupErr);
				}
				errors.push(`${file.name}: failed to save`);
			}
		}

		if (errors.length) {
			return fail(500, { error: `Some uploads failed: ${errors.join(', ')}` });
		}

		return { success: true };
	},

	updateMetadata: async ({ request }) => {
		const supabase = createServiceClient();
		const formData = await request.formData();
		const id = formData.get('id') as string;

		if (!id) return fail(400, { error: 'Photo ID is required.' });

		const eventId = (formData.get('event_id') as string) || null;
		const customTagsRaw = (formData.get('custom_tags') as string) || '[]';
		const peopleTagsRaw = (formData.get('people_tags') as string) || '[]';

		let customTags: string[] = [];
		let peopleTags: { guest_id?: string; name: string }[] = [];

		try {
			customTags = JSON.parse(customTagsRaw);
			if (!Array.isArray(customTags)) customTags = [];
		} catch {
			customTags = [];
		}

		try {
			peopleTags = JSON.parse(peopleTagsRaw);
			if (!Array.isArray(peopleTags)) peopleTags = [];
		} catch {
			peopleTags = [];
		}

		const { error } = await supabase
			.from('photo_uploads')
			.update({
				event_id: eventId,
				custom_tags: customTags,
				people_tags: peopleTags
			})
			.eq('id', id);

		if (error) return fail(500, { error: 'Failed to update metadata.' });

		return { success: true };
	}
};
