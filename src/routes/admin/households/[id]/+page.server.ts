import { createServiceClient } from '$lib/supabase-server';
import { error, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const supabase = createServiceClient();

	const { data: household, error: err } = await supabase
		.from('households')
		.select('*, guests(*)')
		.eq('id', params.id)
		.single();

	if (err || !household) {
		throw error(404, 'Household not found');
	}

	const guestIds = household.guests.map((g: { id: string }) => g.id);

	const [{ data: rsvps }, { data: guestEvents }, { data: events }] = await Promise.all([
		supabase
			.from('rsvps')
			.select('guest_id, event_id, attending, dietary_restrictions')
			.in('guest_id', guestIds),
		supabase
			.from('guest_events')
			.select('guest_id, event_id, events(name)')
			.in('guest_id', guestIds),
		supabase.from('events').select('id, name').order('sort_order', { ascending: true })
	]);

	// Build per-guest event names for display
	const eventsByGuestId: Record<string, string[]> = {};
	for (const ge of guestEvents ?? []) {
		const eventName = (ge.events as unknown as { name: string })?.name;
		if (eventName) {
			if (!eventsByGuestId[ge.guest_id]) eventsByGuestId[ge.guest_id] = [];
			eventsByGuestId[ge.guest_id].push(eventName);
		}
	}

	// Build per-guest RSVP data (first rsvp with attending info for status pill)
	const rsvpByGuestId: Record<string, { attending: boolean | null; dietary_restrictions: { selections?: string[]; other?: string } | null }> = {};
	for (const r of rsvps ?? []) {
		// Use the first attending response found, or keep updating
		if (!rsvpByGuestId[r.guest_id] || r.attending !== null) {
			rsvpByGuestId[r.guest_id] = r;
		}
	}

	return { household, rsvpByGuestId, eventsByGuestId, events: events ?? [] };
};

export const actions: Actions = {
	update: async ({ request, params }) => {
		const supabase = createServiceClient();
		const formData = await request.formData();

		const name = formData.get('name') as string;
		const unique_code = formData.get('unique_code') as string;

		if (!name || !unique_code) {
			return fail(400, { error: 'Name and code are required.' });
		}

		const { error: err } = await supabase
			.from('households')
			.update({ name, unique_code })
			.eq('id', params.id);

		if (err) {
			if (err.code === '23505') {
				return fail(400, { error: 'A household with this code already exists.' });
			}
			return fail(500, { error: 'Failed to update household.' });
		}

		return { success: true };
	},

	addGuest: async ({ request, params }) => {
		const supabase = createServiceClient();
		const formData = await request.formData();

		const first_name = formData.get('first_name') as string;
		const last_name = formData.get('last_name') as string;
		const is_child = formData.get('is_child') === 'on';
		const allows_plus_one = formData.get('allows_plus_one') === 'on';

		if (!first_name || !last_name) {
			return fail(400, { error: 'First and last name are required.' });
		}

		const { data: newGuest, error: err } = await supabase
			.from('guests')
			.insert({ first_name, last_name, is_child, allows_plus_one, household_id: params.id })
			.select('id')
			.single();

		if (err || !newGuest) {
			return fail(500, { error: 'Failed to add guest.' });
		}

		// Assign events
		const eventIds = formData.getAll('event_ids') as string[];
		if (eventIds.length > 0) {
			await supabase.from('guest_events').insert(
				eventIds.map((eventId) => ({ guest_id: newGuest.id, event_id: eventId }))
			);
		}

		return { success: true };
	},

	removeGuest: async ({ request }) => {
		const supabase = createServiceClient();
		const formData = await request.formData();
		const guestId = formData.get('guest_id') as string;

		if (!guestId) return fail(400, { error: 'Guest ID is required.' });

		// guest_events and rsvps cascade-delete via FK
		const { error: err } = await supabase.from('guests').delete().eq('id', guestId);

		if (err) {
			return fail(500, { error: 'Failed to remove guest.' });
		}

		return { success: true };
	}
};
