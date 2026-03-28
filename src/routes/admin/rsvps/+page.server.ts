import { createServiceClient } from '$lib/supabase-server';
import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const supabase = createServiceClient();

	const search = url.searchParams.get('search') ?? '';
	const statusFilter = url.searchParams.get('status') ?? '';
	const eventFilter = url.searchParams.get('event') ?? '';
	const dietaryFilter = url.searchParams.get('dietary') ?? '';

	// Get all events for filter dropdown
	const { data: events } = await supabase
		.from('events')
		.select('id, name')
		.order('date', { ascending: true });

	// Get all guests with their event assignments and RSVPs
	const { data: guests } = await supabase
		.from('guests')
		.select('id, first_name, last_name, is_child, household_id, households(name), guest_events(event_id, events(id, name)), rsvps(id, event_id, attending, dietary_restrictions, song_request, submitted_at, updated_at)')
		.order('last_name', { ascending: true });

	// Fetch contact info (admin can read this table)
	const { data: contactInfo } = await supabase
		.from('guest_contact_info')
		.select('*');

	const contactByGuestId = new Map(
		(contactInfo ?? []).map((c: { guest_id: string }) => [c.guest_id, c])
	);

	// Build flat RSVP rows for the table
	type RsvpRow = {
		rsvpId: string | null;
		guestId: string;
		guestName: string;
		householdName: string;
		eventId: string;
		eventName: string;
		attending: boolean | null;
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
		for (const ge of guest.guest_events ?? []) {
			const rsvp = guest.rsvps?.find(
				(r: { event_id: string }) => r.event_id === ge.event_id
			);

			const household = guest.households as unknown as { name: string } | null;
			const event = ge.events as unknown as { id: string; name: string } | null;
			const contact = contactByGuestId.get(guest.id) as {
				email?: string;
				phone?: string;
				address_street?: string;
				address_unit?: string;
				address_city?: string;
				address_state?: string;
				address_zip?: string;
			} | undefined;

			// Format address as single line for display
			const addressParts = [
				contact?.address_street,
				contact?.address_unit,
				contact?.address_city,
				contact?.address_state && contact?.address_zip
					? `${contact.address_state} ${contact.address_zip}`
					: contact?.address_state || contact?.address_zip
			].filter(Boolean);

			rows.push({
				rsvpId: rsvp?.id ?? null,
				guestId: guest.id,
				guestName: `${guest.first_name} ${guest.last_name}`,
				householdName: household?.name ?? '',
				eventId: ge.event_id,
				eventName: event?.name ?? '',
				attending: rsvp?.attending ?? null,
				dietaryRestrictions: rsvp?.dietary_restrictions ?? null,
				songRequest: rsvp?.song_request ?? '',
				email: contact?.email ?? null,
				phone: contact?.phone ?? null,
				address: addressParts.length > 0 ? addressParts.join(', ') : null,
				submittedAt: rsvp?.submitted_at ?? null,
				updatedAt: rsvp?.updated_at ?? null
			});
		}
	}

	// Apply filters
	if (search) {
		const s = search.toLowerCase();
		rows = rows.filter((r) => r.guestName.toLowerCase().includes(s));
	}
	if (eventFilter) {
		rows = rows.filter((r) => r.eventId === eventFilter);
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

	return { rows, events: events ?? [], search, statusFilter, eventFilter, dietaryFilter };
};

export const actions: Actions = {
	update: async ({ request }) => {
		const supabase = createServiceClient();
		const formData = await request.formData();

		const guest_id = formData.get('guest_id') as string;
		const event_id = formData.get('event_id') as string;
		const attending = formData.get('attending') as string;
		const song_request = (formData.get('song_request') as string) ?? '';

		// Parse dietary
		const dietarySelections = formData.getAll('dietary_selections') as string[];
		const dietaryOther = (formData.get('dietary_other') as string) ?? '';

		if (!guest_id || !event_id) {
			return fail(400, { error: 'Guest and event are required.' });
		}

		const attendingValue = attending === 'yes' ? true : attending === 'no' ? false : null;

		const { error } = await supabase.from('rsvps').upsert(
			{
				guest_id,
				event_id,
				attending: attendingValue,
				dietary_restrictions: { selections: dietarySelections, other: dietaryOther },
				song_request,
				submitted_at: new Date().toISOString(),
				updated_at: new Date().toISOString()
			},
			{ onConflict: 'guest_id,event_id' }
		);

		if (error) {
			return fail(500, { error: 'Failed to update RSVP.' });
		}

		return { success: true };
	}
};
