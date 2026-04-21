import { createServiceClient } from '$lib/supabase-server';
import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async () => {
	const supabase = createServiceClient();

	const [{ data: households }, { data: events }] = await Promise.all([
		supabase.from('households').select('id, name').order('name', { ascending: true }),
		supabase.from('events').select('id, name').order('sort_order', { ascending: true })
	]);

	return {
		households: households ?? [],
		events: events ?? []
	};
};

export const actions: Actions = {
	default: async ({ request }) => {
		const supabase = createServiceClient();
		const formData = await request.formData();

		const first_name = (formData.get('first_name') as string)?.trim();
		const last_name = (formData.get('last_name') as string)?.trim();
		const household_id = formData.get('household_id') as string;
		const is_child = formData.get('is_child') === 'on';
		const allows_plus_one = formData.get('allows_plus_one') === 'on';

		if (!first_name || !last_name || !household_id) {
			return fail(400, { error: 'First name, last name, and household are required.' });
		}

		const { data: newGuest, error: guestError } = await supabase
			.from('guests')
			.insert({ first_name, last_name, household_id, is_child, allows_plus_one })
			.select('id')
			.single();

		if (guestError || !newGuest) {
			return fail(500, { error: 'Failed to create guest.' });
		}

		// Assign events
		const eventIds = formData.getAll('event_ids') as string[];
		if (eventIds.length > 0) {
			const rows = eventIds.map((eventId) => ({
				guest_id: newGuest.id,
				event_id: eventId
			}));
			await supabase.from('guest_events').insert(rows);
		}

		return { success: true };
	}
};
