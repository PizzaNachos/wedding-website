import { createServiceClient } from '$lib/supabase-server';
import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const supabase = createServiceClient();

	const search = url.searchParams.get('search') ?? '';
	const statusFilter = url.searchParams.get('status') ?? '';
	const dietaryFilter = url.searchParams.get('dietary') ?? '';
	const ceremonyFilter = url.searchParams.get('ceremony') ?? '';

	// Get all guests with RSVPs
	const { data: guests } = await supabase
		.from('guests')
		.select(
			'id, first_name, last_name, is_child, household_id, households(name), rsvps(id, attending, dietary_restrictions, song_request, submitted_at, updated_at)'
		)
		.order('last_name', { ascending: true });

	// Fetch ceremony interest
	const { data: ceremonyInterest } = await supabase
		.from('ceremony_interest')
		.select('*');

	const ceremonyByGuestId = new Map(
		(ceremonyInterest ?? []).map((c: { guest_id: string }) => [c.guest_id, c])
	);

	// Fetch household contact info
	const { data: contactInfo } = await supabase
		.from('household_contact_info')
		.select('*');

	const contactByHouseholdId = new Map(
		(contactInfo ?? []).map((c: { household_id: string }) => [c.household_id, c])
	);

	// Build flat RSVP rows for the table
	type RsvpRow = {
		rsvpId: string | null;
		guestId: string;
		guestName: string;
		householdName: string;
		attending: boolean | null;
		ceremonyInterest: string | null;
		ceremonyOtherText: string | null;
		dietaryRestrictions: { selections: string[]; other: string } | null;
		songRequest: string;
		email: string | null;
		phone: string | null;
		address: string | null;
		submittedAt: string | null;
		updatedAt: string | null;
	};

	let rows: RsvpRow[] = [];

	for (const guest of guests ?? []) {
		const rsvp = guest.rsvps?.[0]; // One RSVP per guest now
		const household = guest.households as unknown as { name: string } | null;
		const ceremony = ceremonyByGuestId.get(guest.id) as {
			interest_level?: string;
			other_text?: string;
		} | undefined;
		const contact = contactByHouseholdId.get(guest.household_id) as {
			email?: string;
			phone?: string;
			address_street?: string;
			address_city?: string;
			address_state?: string;
			address_country?: string;
			address_postal_code?: string;
		} | undefined;

		const addressParts = [
			contact?.address_street,
			contact?.address_city,
			contact?.address_state,
			contact?.address_country,
			contact?.address_postal_code
		].filter(Boolean);

		rows.push({
			rsvpId: rsvp?.id ?? null,
			guestId: guest.id,
			guestName: `${guest.first_name} ${guest.last_name}`,
			householdName: household?.name ?? '',
			attending: rsvp?.attending ?? null,
			ceremonyInterest: ceremony?.interest_level ?? null,
			ceremonyOtherText: ceremony?.other_text ?? null,
			dietaryRestrictions: rsvp?.dietary_restrictions ?? null,
			songRequest: rsvp?.song_request ?? '',
			email: contact?.email ?? null,
			phone: contact?.phone ?? null,
			address: addressParts.length > 0 ? addressParts.join(', ') : null,
			submittedAt: rsvp?.submitted_at ?? null,
			updatedAt: rsvp?.updated_at ?? null
		});
	}

	// Apply filters
	if (search) {
		const s = search.toLowerCase();
		rows = rows.filter((r) => r.guestName.toLowerCase().includes(s));
	}
	if (statusFilter === 'attending') {
		rows = rows.filter((r) => r.attending === true);
	} else if (statusFilter === 'declined') {
		rows = rows.filter((r) => r.attending === false);
	} else if (statusFilter === 'pending') {
		rows = rows.filter((r) => r.attending === null);
	}
	if (dietaryFilter) {
		rows = rows.filter((r) =>
			r.dietaryRestrictions?.selections?.includes(dietaryFilter)
		);
	}
	if (ceremonyFilter) {
		rows = rows.filter((r) => r.ceremonyInterest === ceremonyFilter);
	}

	return { rows, search, statusFilter, dietaryFilter, ceremonyFilter };
};

export const actions: Actions = {
	update: async ({ request }) => {
		const supabase = createServiceClient();
		const formData = await request.formData();

		const guest_id = formData.get('guest_id') as string;
		const attending = formData.get('attending') as string;
		const song_request = (formData.get('song_request') as string) ?? '';

		// Parse dietary
		const dietarySelections = formData.getAll('dietary_selections') as string[];
		const dietaryOther = (formData.get('dietary_other') as string) ?? '';

		if (!guest_id) {
			return fail(400, { error: 'Guest is required.' });
		}

		const attendingValue = attending === 'yes' ? true : attending === 'no' ? false : null;

		const { error } = await supabase.from('rsvps').upsert(
			{
				guest_id,
				attending: attendingValue,
				dietary_restrictions: { selections: dietarySelections, other: dietaryOther },
				song_request,
				submitted_at: new Date().toISOString(),
				updated_at: new Date().toISOString()
			},
			{ onConflict: 'guest_id' }
		);

		if (error) {
			return fail(500, { error: 'Failed to update RSVP.' });
		}

		return { success: true };
	}
};
