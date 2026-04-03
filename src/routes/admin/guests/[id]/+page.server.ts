import { createServiceClient } from '$lib/supabase-server';
import { error, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const supabase = createServiceClient();

	const [{ data: guest, error: err }, { data: households }, { data: events }] = await Promise.all([
		supabase
			.from('guests')
			.select('*, households(id, name), rsvps(event_id, attending, dietary_restrictions)')
			.eq('id', params.id)
			.single(),
		supabase.from('households').select('id, name').order('name', { ascending: true }),
		supabase.from('events').select('id, name').order('sort_order', { ascending: true })
	]);

	if (err || !guest) {
		throw error(404, 'Guest not found');
	}

	const [{ data: contactInfo }, { data: guestEvents }] = await Promise.all([
		supabase
			.from('household_contact_info')
			.select('*')
			.eq('household_id', guest.household_id)
			.maybeSingle(),
		supabase.from('guest_events').select('*').eq('guest_id', params.id)
	]);

	return {
		guest,
		contactInfo,
		events: events ?? [],
		guestEvents: guestEvents ?? [],
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

		const { error: guestError } = await supabase
			.from('guests')
			.update({ first_name, last_name, household_id, is_child })
			.eq('id', params.id);

		if (guestError) {
			return fail(500, { error: 'Failed to update guest.' });
		}

		return { success: true };
	},

	updateEvents: async ({ request, params }) => {
		const supabase = createServiceClient();
		const formData = await request.formData();
		const eventIds = formData.getAll('event_ids') as string[];

		// Delete existing guest_events for this guest
		await supabase.from('guest_events').delete().eq('guest_id', params.id);

		// Insert new assignments
		if (eventIds.length > 0) {
			const rows = eventIds.map((eventId) => ({
				guest_id: params.id,
				event_id: eventId
			}));
			const { error: insertError } = await supabase.from('guest_events').insert(rows);
			if (insertError) {
				return fail(500, { error: 'Failed to update event assignments.' });
			}
		}

		return { success: true };
	}
};
