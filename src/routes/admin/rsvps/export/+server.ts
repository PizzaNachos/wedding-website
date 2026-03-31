import { createServiceClient } from '$lib/supabase-server';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) {
		return new Response('Unauthorized', { status: 401 });
	}

	const supabase = createServiceClient();

	const { data: guests } = await supabase
		.from('guests')
		.select(
			'id, first_name, last_name, is_child, household_id, households(name), rsvps(attending, dietary_restrictions, song_request, submitted_at, updated_at)'
		)
		.order('last_name', { ascending: true });

	// Fetch ceremony interest
	const { data: ceremonyInterest } = await supabase
		.from('ceremony_interest')
		.select('guest_id, interest_level, other_text');

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

	const csvRows: string[][] = [
		[
			'Guest Name',
			'Household',
			'Child',
			'Attending',
			'Ceremony Interest',
			'Ceremony Other Text',
			'Dietary Restrictions',
			'Song Request',
			'Email',
			'Phone',
			'Street',
			'City',
			'State/Province',
			'Country',
			'Postal Code',
			'Submitted At',
			'Updated At'
		]
	];

	for (const guest of guests ?? []) {
		const rsvp = guest.rsvps?.[0];
		const dietary = rsvp?.dietary_restrictions as
			| { selections?: string[]; other?: string }
			| null;
		const dietaryStr = [
			...(dietary?.selections ?? []),
			...(dietary?.other ? [`Other: ${dietary.other}`] : [])
		].join('; ');

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

		csvRows.push([
			`${guest.first_name} ${guest.last_name}`,
			household?.name ?? '',
			guest.is_child ? 'Yes' : 'No',
			rsvp?.attending === true ? 'Yes' : rsvp?.attending === false ? 'No' : 'Pending',
			ceremony?.interest_level ?? '',
			ceremony?.other_text ?? '',
			dietaryStr,
			rsvp?.song_request ?? '',
			contact?.email ?? '',
			contact?.phone ?? '',
			contact?.address_street ?? '',
			contact?.address_city ?? '',
			contact?.address_state ?? '',
			contact?.address_country ?? '',
			contact?.address_postal_code ?? '',
			rsvp?.submitted_at ?? '',
			rsvp?.updated_at ?? ''
		]);
	}

	const csv = csvRows
		.map((row) =>
			row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
		)
		.join('\n');

	const date = new Date().toISOString().slice(0, 10);

	return new Response(csv, {
		headers: {
			'Content-Type': 'text/csv',
			'Content-Disposition': `attachment; filename="rsvps-${date}.csv"`
		}
	});
};
