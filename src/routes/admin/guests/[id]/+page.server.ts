import { createServiceClient } from '$lib/supabase-server';
import { error, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const supabase = createServiceClient();

	const { data: guest, error: err } = await supabase
		.from('guests')
		.select('*, households(id, name), guest_events(event_id), rsvps(event_id, attending, dietary_restrictions, song_request)')
		.eq('id', params.id)
		.single();

	if (err || !guest) {
		throw error(404, 'Guest not found');
	}

	const { data: events } = await supabase
		.from('events')
		.select('id, name')
		.order('date', { ascending: true });

	const { data: households } = await supabase
		.from('households')
		.select('id, name')
		.order('name', { ascending: true });

	const { data: contactInfo } = await supabase
		.from('guest_contact_info')
		.select('*')
		.eq('guest_id', params.id)
		.maybeSingle();

	return {
		guest,
		contactInfo,
		events: events ?? [],
		households: households ?? []
	};
};

export const actions: Actions = {
	update: async ({ request, params }) => {
		const supabase = createServiceClient();
		const formData = await request.formData();

		const first_name = formData.get('first_name') as string;
		const last_name = formData.get('last_name') as string;
		const household_id = formData.get('household_id') as string;
		const is_child = formData.get('is_child') === 'on';

		if (!first_name || !last_name || !household_id) {
			return fail(400, { error: 'First name, last name, and household are required.' });
		}

		// Update guest
		const { error: guestError } = await supabase
			.from('guests')
			.update({ first_name, last_name, household_id, is_child })
			.eq('id', params.id);

		if (guestError) {
			return fail(500, { error: 'Failed to update guest.' });
		}

		// Update event assignments
		const selectedEventIds = formData.getAll('event_ids') as string[];

		// Remove all existing guest_events
		await supabase.from('guest_events').delete().eq('guest_id', params.id);

		// Insert selected ones
		if (selectedEventIds.length > 0) {
			const rows = selectedEventIds.map((event_id) => ({
				guest_id: params.id,
				event_id
			}));
			await supabase.from('guest_events').insert(rows);
		}

		return { success: true };
	}
};
