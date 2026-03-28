import { createServiceClient } from '$lib/supabase-server';
import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const supabase = createServiceClient();

	const search = url.searchParams.get('search') ?? '';
	const statusFilter = url.searchParams.get('status') ?? '';
	const dietaryFilter = url.searchParams.get('dietary') ?? '';

	// Get all guests with household, events, and RSVPs
	let query = supabase
		.from('guests')
		.select('*, households(id, name), guest_events(event_id, events(name)), rsvps(event_id, attending, dietary_restrictions, song_request)')
		.order('last_name', { ascending: true });

	if (search) {
		query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%`);
	}

	const { data: guests } = await query;

	let filteredGuests = guests ?? [];

	// Apply status filter
	if (statusFilter === 'attending') {
		filteredGuests = filteredGuests.filter((g) =>
			g.rsvps?.some((r: { attending: boolean | null }) => r.attending === true)
		);
	} else if (statusFilter === 'declined') {
		filteredGuests = filteredGuests.filter((g) =>
			g.rsvps?.some((r: { attending: boolean | null }) => r.attending === false)
		);
	} else if (statusFilter === 'pending') {
		filteredGuests = filteredGuests.filter(
			(g) => !g.rsvps?.length || g.rsvps.every((r: { attending: boolean | null }) => r.attending === null)
		);
	}

	// Apply dietary filter
	if (dietaryFilter) {
		filteredGuests = filteredGuests.filter((g) =>
			g.rsvps?.some((r: { dietary_restrictions: { selections?: string[] } | null }) =>
				r.dietary_restrictions?.selections?.includes(dietaryFilter)
			)
		);
	}

	// Fetch contact info emails
	const { data: contactInfo } = await supabase
		.from('guest_contact_info')
		.select('guest_id, email');

	const emailByGuestId: Record<string, string> = {};
	for (const c of contactInfo ?? []) {
		emailByGuestId[c.guest_id] = c.email;
	}

	return { guests: filteredGuests, emailByGuestId, search, statusFilter, dietaryFilter };
};

export const actions: Actions = {
	delete: async ({ request }) => {
		const supabase = createServiceClient();
		const formData = await request.formData();
		const id = formData.get('id') as string;

		if (!id) return fail(400, { error: 'Guest ID is required.' });

		await supabase.from('rsvps').delete().eq('guest_id', id);
		await supabase.from('guest_events').delete().eq('guest_id', id);
		const { error } = await supabase.from('guests').delete().eq('id', id);

		if (error) {
			return fail(500, { error: 'Failed to delete guest.' });
		}

		return { success: true };
	}
};
