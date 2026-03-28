import { getImageUrl } from '$lib/cloudflare-images';
import type { SupabaseClient } from '@supabase/supabase-js';
import { PAGE_SIZE, type Photo, type TabId } from '$lib/photo-types';

export { PAGE_SIZE, type Photo, type TabId };

export const PHOTO_SELECT = 'id, cloudflare_image_id, original_filename, category, custom_tags';

export const GUEST_PHOTO_SELECT =
	'id, cloudflare_image_id, original_filename, uploader_guest_id, guests!uploader_guest_id(first_name, last_name), custom_tags';

export function mapPhoto(p: any): Photo {
	return {
		id: p.id,
		url: getImageUrl(p.cloudflare_image_id, 'thumbnail'),
		fullUrl: getImageUrl(p.cloudflare_image_id, 'full'),
		originalUrl: getImageUrl(p.cloudflare_image_id, 'original'),
		name: p.original_filename ?? 'Photo',
		custom_tags: p.custom_tags ?? []
	};
}

export function mapGuestPhoto(p: any): Photo {
	return {
		...mapPhoto(p),
		uploader_name: p.guests ? `${p.guests.first_name} ${p.guests.last_name}` : null
	};
}

export function buildPhotoQuery(
	supabase: SupabaseClient,
	tab: TabId,
	offset: number,
	limit: number
) {
	const isGuest = tab === 'guest';
	const select = isGuest ? GUEST_PHOTO_SELECT : PHOTO_SELECT;

	let query = supabase
		.from('photo_uploads')
		.select(select, { count: 'exact' })
		.eq('status', 'approved')
		.eq('source', isGuest ? 'guest' : 'admin')
		.not('cloudflare_image_id', 'is', null)
		.order('uploaded_at', { ascending: false })
		.range(offset, offset + limit - 1);

	if (!isGuest) {
		query = query.eq('category', tab);
	}

	return query;
}
