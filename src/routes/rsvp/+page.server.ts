import { redirect } from '@sveltejs/kit';
import { supabase } from '$lib/supabase';
import { findGuestsByName } from '$lib/guest-lookup';
import type { Actions } from './$types';

const MAX_HOUSEHOLD_CHOICES = 3;

interface RsvpHouseholdChoice {
	householdId: string;
	householdName: string;
	householdCode: string;
	guests: { id: string; first_name: string; last_name: string }[];
}

function hasLastNameSearch(name: string): boolean {
	return name.trim().split(/\s+/).length > 1;
}

async function getRsvpHouseholdChoices(
	householdIds: string[]
): Promise<{ choices: RsvpHouseholdChoice[]; error?: string }> {
	const { data: households, error: queryError } = await supabase
		.from('households')
		.select('id, name, unique_code, guests(id, first_name, last_name)')
		.in('id', householdIds)
		.order('name', { ascending: true });

	if (queryError || !households) {
		return { choices: [], error: 'Something went wrong. Please try again.' };
	}

	return {
		choices: households.map((household) => ({
			householdId: household.id,
			householdName: household.name,
			householdCode: household.unique_code,
			guests: household.guests ?? []
		}))
	};
}

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

		const householdIds = [...new Set(guests.map((guest) => guest.household_id))];

		if (hasLastNameSearch(name) && householdIds.length <= MAX_HOUSEHOLD_CHOICES) {
			const { choices, error: choiceError } = await getRsvpHouseholdChoices(householdIds);

			if (choiceError) {
				return { matchCount: guests.length, message: choiceError };
			}

			return {
				matchCount: guests.length,
				choices
			};
		}

		// Multiple matches — reveal only the count
		return {
			matchCount: guests.length,
			message: `${guests.length} results found — please refine your search with your full first and last name.`
		};
	}
};
