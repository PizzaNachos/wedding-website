import type { SupabaseClient } from '@supabase/supabase-js';

export interface GuestMatch {
	id: string;
	first_name: string;
	last_name: string;
	household_id: string;
	households: { unique_code: string; name: string };
}

export async function findGuestsByName(
	supabase: SupabaseClient,
	name: string
): Promise<{ guests: GuestMatch[]; error?: string }> {
	const trimmed = name.trim();
	if (!trimmed) {
		return { guests: [], error: 'Please enter your name.' };
	}

	const parts = trimmed.split(/\s+/);
	const firstName = parts[0];
	const lastName = parts.length > 1 ? parts.slice(1).join(' ') : null;

	let query = supabase
		.from('guests')
		.select('id, first_name, last_name, household_id, households!inner(unique_code, name)')
		.ilike('first_name', `${firstName}%`);

	if (lastName) {
		query = query.ilike('last_name', `${lastName}%`);
	}

	const { data: matches, error: queryError } = await query;

	if (queryError || !matches) {
		return { guests: [], error: 'Something went wrong. Please try again.' };
	}

	return { guests: matches as unknown as GuestMatch[] };
}
