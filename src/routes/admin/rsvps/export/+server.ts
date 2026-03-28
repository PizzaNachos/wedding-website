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
			'id, first_name, last_name, is_child, households(name), guest_events(event_id, events(name)), rsvps(event_id, attending, dietary_restrictions, song_request, submitted_at, updated_at)'
		)
		.order('last_name', { ascending: true });

	// Fetch contact info for export
	const { data: contactInfo } = await supabase
		.from('guest_contact_info')
		.select('*');

	const contactByGuestId = new Map(
		(contactInfo ?? []).map((c: { guest_id: string }) => [c.guest_id, c])
	);

	const rows: string[][] = [
		[
			'Guest Name',
			'Household',
			'Child',
			'Event',
			'Attending',
			'Dietary Restrictions',
			'Song Request',
			'Email',
			'Phone',
			'Street',
			'Apt/Unit',
			'City',
			'State',
			'ZIP',
			'Submitted At',
			'Updated At'
		]
	];

	for (const guest of guests ?? []) {
		for (const ge of guest.guest_events ?? []) {
			const rsvp = guest.rsvps?.find(
				(r: { event_id: string }) => r.event_id === ge.event_id
			);

			const dietary = rsvp?.dietary_restrictions as
				| { selections?: string[]; other?: string }
				| null;
			const dietaryStr = [
				...(dietary?.selections ?? []),
				...(dietary?.other ? [`Other: ${dietary.other}`] : [])
			].join('; ');

			const household = guest.households as unknown as { name: string } | null;
			const event = ge.events as unknown as { name: string } | null;

			const contact = contactByGuestId.get(guest.id) as {
				email?: string;
				phone?: string;
				address_street?: string;
				address_unit?: string;
				address_city?: string;
				address_state?: string;
				address_zip?: string;
			} | undefined;

			rows.push([
				`${guest.first_name} ${guest.last_name}`,
				household?.name ?? '',
				guest.is_child ? 'Yes' : 'No',
				event?.name ?? '',
				rsvp?.attending === true ? 'Yes' : rsvp?.attending === false ? 'No' : 'Pending',
				dietaryStr,
				rsvp?.song_request ?? '',
				contact?.email ?? '',
				contact?.phone ?? '',
				contact?.address_street ?? '',
				contact?.address_unit ?? '',
				contact?.address_city ?? '',
				contact?.address_state ?? '',
				contact?.address_zip ?? '',
				rsvp?.submitted_at ?? '',
				rsvp?.updated_at ?? ''
			]);
		}
	}

	const csv = rows
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
