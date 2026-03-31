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

	const { data: rsvps } = await supabase
		.from('rsvps')
		.select('guest_id, attending, dietary_restrictions')
		.in('guest_id', guestIds);

	const rsvpByGuestId: Record<string, { attending: boolean | null; dietary_restrictions: { selections?: string[]; other?: string } | null }> = {};
	for (const r of rsvps ?? []) {
		rsvpByGuestId[r.guest_id] = r;
	}

	const { data: ceremonyInterest } = await supabase
		.from('ceremony_interest')
		.select('guest_id, interest_level, other_text')
		.in('guest_id', guestIds);

	const ceremonyByGuestId: Record<string, { interest_level: string; other_text: string | null }> = {};
	for (const c of ceremonyInterest ?? []) {
		ceremonyByGuestId[c.guest_id] = c;
	}

	return { household, rsvpByGuestId, ceremonyByGuestId };
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

		if (!first_name || !last_name) {
			return fail(400, { error: 'First and last name are required.' });
		}

		const { error: err } = await supabase
			.from('guests')
			.insert({ first_name, last_name, is_child, household_id: params.id });

		if (err) {
			return fail(500, { error: 'Failed to add guest.' });
		}

		return { success: true };
	},

	removeGuest: async ({ request }) => {
		const supabase = createServiceClient();
		const formData = await request.formData();
		const guestId = formData.get('guest_id') as string;

		if (!guestId) return fail(400, { error: 'Guest ID is required.' });

		await supabase.from('rsvps').delete().eq('guest_id', guestId);
		await supabase.from('ceremony_interest').delete().eq('guest_id', guestId);
		const { error: err } = await supabase.from('guests').delete().eq('id', guestId);

		if (err) {
			return fail(500, { error: 'Failed to remove guest.' });
		}

		return { success: true };
	}
};
