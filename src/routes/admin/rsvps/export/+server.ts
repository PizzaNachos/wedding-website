import { createServiceClient } from '$lib/supabase-server';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) {
		return new Response('Unauthorized', { status: 401 });
	}

	const supabase = createServiceClient();

	const [{ data: guests }, { data: events }, { data: guestEvents }, { data: contactInfo }] =
		await Promise.all([
			supabase
				.from('guests')
				.select(
					'id, first_name, last_name, is_child, household_id, households(name), rsvps(event_id, attending, dietary_restrictions, submitted_at)'
				)
				.order('last_name', { ascending: true }),
			supabase.from('events').select('id, name').order('sort_order', { ascending: true }),
			supabase.from('guest_events').select('guest_id, event_id'),
			supabase.from('household_contact_info').select('*')
		]);

	const eventList = events ?? [];
	const guestEventSet = new Set(
		(guestEvents ?? []).map((ge) => `${ge.guest_id}:${ge.event_id}`)
	);

	const contactByHouseholdId = new Map(
		(contactInfo ?? []).map((c: { household_id: string }) => [c.household_id, c])
	);

	// Build CSV header
	const header = [
		'Guest Name',
		'Household',
		'Child',
		...eventList.map((e) => e.name),
		'Dietary Restrictions',
		'Email',
		'Phone',
		'Street',
		'City',
		'State/Province',
		'Country',
		'Postal Code',
		'Submitted At'
	];

	const csvRows: string[][] = [header];

	for (const guest of guests ?? []) {
		const household = guest.households as unknown as { name: string } | null;
		const contact = contactByHouseholdId.get(guest.household_id) as {
			email?: string;
			phone?: string;
			address_street?: string;
			address_city?: string;
			address_state?: string;
			address_country?: string;
			address_postal_code?: string;
		} | undefined;

		// Per-event attendance
		const eventCols: string[] = [];
		let dietary: { selections?: string[]; other?: string } | null = null;
		let latestSubmission = '';

		for (const event of eventList) {
			const invited = guestEventSet.has(`${guest.id}:${event.id}`);
			if (!invited) {
				eventCols.push('Not Invited');
				continue;
			}
			const rsvp = guest.rsvps?.find(
				(r: { event_id: string }) => r.event_id === event.id
			);
			if (rsvp?.attending === true) eventCols.push('Yes');
			else if (rsvp?.attending === false) eventCols.push('No');
			else eventCols.push('Pending');

			if (rsvp?.dietary_restrictions?.selections?.length || rsvp?.dietary_restrictions?.other) {
				dietary = rsvp.dietary_restrictions;
			}
			if (rsvp?.submitted_at && rsvp.submitted_at > latestSubmission) {
				latestSubmission = rsvp.submitted_at;
			}
		}

		const dietaryStr = [
			...(dietary?.selections ?? []),
			...(dietary?.other ? [`Other: ${dietary.other}`] : [])
		].join('; ');

		csvRows.push([
			`${guest.first_name} ${guest.last_name}`,
			household?.name ?? '',
			guest.is_child ? 'Yes' : 'No',
			...eventCols,
			dietaryStr,
			contact?.email ?? '',
			contact?.phone ?? '',
			contact?.address_street ?? '',
			contact?.address_city ?? '',
			contact?.address_state ?? '',
			contact?.address_country ?? '',
			contact?.address_postal_code ?? '',
			latestSubmission
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
