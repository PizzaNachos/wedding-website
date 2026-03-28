import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/supabase';
import { buildPhotoQuery, mapPhoto, mapGuestPhoto, PAGE_SIZE, type TabId } from '$lib/photo-queries';

const VALID_TABS: TabId[] = ['engagement', 'ceremony', 'reception', 'guest'];

export const GET: RequestHandler = async ({ url }) => {
	const tab = url.searchParams.get('tab') as TabId;
	const offset = parseInt(url.searchParams.get('offset') ?? '0', 10);
	const limit = Math.min(parseInt(url.searchParams.get('limit') ?? String(PAGE_SIZE), 10), 50);

	if (!tab || !VALID_TABS.includes(tab)) {
		return json({ error: 'Invalid tab parameter' }, { status: 400 });
	}

	if (isNaN(offset) || offset < 0) {
		return json({ error: 'Invalid offset parameter' }, { status: 400 });
	}

	const { data, count, error } = await buildPhotoQuery(supabase, tab, offset, limit);

	if (error) {
		return json({ error: 'Failed to fetch photos' }, { status: 500 });
	}

	const mapper = tab === 'guest' ? mapGuestPhoto : mapPhoto;
	const photos = (data ?? []).map(mapper);

	return json({ photos, total: count ?? 0 });
};
