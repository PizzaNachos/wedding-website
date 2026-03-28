import { redirect } from '@sveltejs/kit';
import { supabase } from '$lib/supabase';
import { findGuestsByName } from '$lib/guest-lookup';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const name = String(formData.get('name') ?? '').trim();

		if (!name) {
			return { matchCount: 0, message: 'Please enter your name.' };
		}

		const { guests, error } = await findGuestsByName(supabase, name);

		if (error) {
			return { matchCount: 0, message: error };
		}

		if (guests.length === 0) {
			return { matchCount: 0, message: 'No results found. Please check the spelling and try again.' };
		}

		if (guests.length === 1) {
			const code = guests[0].households.unique_code;
			throw redirect(303, `/rsvp/${code}`);
		}

		// Multiple matches — reveal only the count
		return {
			matchCount: guests.length,
			message: `${guests.length} results found — please refine your search with your full first and last name.`
		};
	}
};
