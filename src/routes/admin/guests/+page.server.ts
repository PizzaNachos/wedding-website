import { createServiceClient } from '$lib/supabase-server';
import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const supabase = createServiceClient();

	const search = url.searchParams.get('search') ?? '';
	const statusFilter = url.searchParams.get('status') ?? '';
	const dietaryFilter = url.searchParams.get('dietary') ?? '';

	// Get all guests with household and RSVPs
	let query = supabase
		.from('guests')
		.select('*, households(id, name), rsvps(event_id, attending, dietary_restrictions)')
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

	// Fetch household contact info for emails
	const { data: contactInfo } = await supabase
		.from('household_contact_info')
		.select('household_id, email');

	const emailByHouseholdId: Record<string, string> = {};
	for (const c of contactInfo ?? []) {
		emailByHouseholdId[c.household_id] = c.email;
	}

	// Fetch guest_events with event names
	const { data: guestEventsList } = await supabase
		.from('guest_events')
		.select('guest_id, events(name)');

	const eventsByGuestId: Record<string, string[]> = {};
	for (const ge of guestEventsList ?? []) {
		const eventName = (ge.events as unknown as { name: string })?.name;
		if (eventName) {
			if (!eventsByGuestId[ge.guest_id]) eventsByGuestId[ge.guest_id] = [];
			eventsByGuestId[ge.guest_id].push(eventName);
		}
	}

	return { guests: filteredGuests, emailByHouseholdId, eventsByGuestId, search, statusFilter, dietaryFilter };
};

export const actions: Actions = {
	delete: async ({ request }) => {
		const supabase = createServiceClient();
		const formData = await request.formData();
		const id = formData.get('id') as string;

		if (!id) return fail(400, { error: 'Guest ID is required.' });

		// guest_events and rsvps cascade-delete via FK
		const { error } = await supabase.from('guests').delete().eq('id', id);

		if (error) {
			return fail(500, { error: 'Failed to delete guest.' });
		}

		return { success: true };
	}
};
