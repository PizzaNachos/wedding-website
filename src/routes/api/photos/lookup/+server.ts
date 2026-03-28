import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabase';
import { findGuestsByName } from '$lib/guest-lookup';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const { name } = await request.json();

	if (!name || typeof name !== 'string') {
		return json({ guests: [], message: 'Please enter your name.' }, { status: 400 });
	}

	const { guests, error } = await findGuestsByName(supabase, name);

	if (error) {
		return json({ guests: [], message: error }, { status: 500 });
	}

	if (guests.length === 0) {
		return json({
			guests: [],
			message: 'No results found. Please check the spelling and try again.'
		});
	}

	// Return guest info (without household codes — those aren't needed for photo uploads)
	return json({
		guests: guests.map((g) => ({
			id: g.id,
			first_name: g.first_name,
			last_name: g.last_name,
			household_name: g.households.name,
			household_code: g.households.unique_code
		})),
		message:
			guests.length > 1
				? `${guests.length} results found — please refine your search with your full first and last name.`
				: undefined
	});
};
