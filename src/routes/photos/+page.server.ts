import { supabase } from '$lib/supabase';
import {
	buildPhotoQuery,
	mapPhoto,
	mapGuestPhoto,
	PAGE_SIZE,
	type TabId
} from '$lib/photo-queries';
import type { PageServerLoad } from './$types';

async function loadTab(tab: TabId) {
	const { data, count, error } = await buildPhotoQuery(supabase, tab, 0, PAGE_SIZE);
	console.log("Data and stuff", data, count, error)
	if (error) {
		return { photos: [], total: 0 };
	}

	const mapper = tab === 'guest' ? mapGuestPhoto : mapPhoto;
	return {
		photos: (data ?? []).map(mapper),
		total: count ?? 0
	};
}

export const load: PageServerLoad = async () => {
	const [engagement, ceremony, reception, guest] = await Promise.all([
		loadTab('engagement'),
		loadTab('ceremony'),
		loadTab('reception'),
		loadTab('guest')
	]);

	return { engagement, ceremony, reception, guest };
};
