import { createServiceClient } from '$lib/supabase-server';
import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async () => {
	const supabase = createServiceClient();

	const { data: households } = await supabase
		.from('households')
		.select('*, guests(id, first_name, last_name)')
		.order('name', { ascending: true });

	return { households: households ?? [] };
};

export const actions: Actions = {
	create: async ({ request }) => {
		const supabase = createServiceClient();
		const formData = await request.formData();

		const name = formData.get('name') as string;
		const unique_code = formData.get('unique_code') as string;

		if (!name || !unique_code) {
			return fail(400, { error: 'Name and code are required.' });
		}

		const { error } = await supabase.from('households').insert({ name, unique_code });

		if (error) {
			if (error.code === '23505') {
				return fail(400, { error: 'A household with this code already exists.' });
			}
			return fail(500, { error: 'Failed to create household.' });
		}

		return { success: true };
	},

	delete: async ({ request }) => {
		const supabase = createServiceClient();
		const formData = await request.formData();
		const id = formData.get('id') as string;

		if (!id) return fail(400, { error: 'Household ID is required.' });

		// Get guest IDs for this household
		const { data: guests } = await supabase
			.from('guests')
			.select('id')
			.eq('household_id', id);

		const guestIds = (guests ?? []).map((g) => g.id);

		if (guestIds.length > 0) {
			await supabase.from('rsvps').delete().in('guest_id', guestIds);
			await supabase.from('ceremony_interest').delete().in('guest_id', guestIds);
			await supabase.from('guests').delete().eq('household_id', id);
		}

		await supabase.from('household_contact_info').delete().eq('household_id', id);

		const { error } = await supabase.from('households').delete().eq('id', id);

		if (error) {
			return fail(500, { error: 'Failed to delete household.' });
		}

		return { success: true };
	}
};
