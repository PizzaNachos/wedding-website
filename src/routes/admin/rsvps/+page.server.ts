import { createServiceClient } from '$lib/supabase-server';
import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const supabase = createServiceClient();

	const search = url.searchParams.get('search') ?? '';
	const statusFilter = url.searchParams.get('status') ?? '';
	const dietaryFilter = url.searchParams.get('dietary') ?? '';

	// Get all data in parallel
	const [{ data: guests }, { data: events }, { data: guestEvents }, { data: contactInfo }] =
		await Promise.all([
			supabase
				.from('guests')
				.select(
					'id, first_name, last_name, is_child, household_id, households(name), rsvps(id, event_id, attending, dietary_restrictions, submitted_at, updated_at)'
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

	// Build flat RSVP rows
	type RsvpRow = {
		guestId: string;
		guestName: string;
		householdName: string;
		eventAttendance: Record<string, boolean | null>; // keyed by event_id
		eventInvited: Record<string, boolean>; // keyed by event_id
		dietaryRestrictions: { selections: string[]; other: string } | null;
		email: string | null;
		phone: string | null;
		address: string | null;
		submittedAt: string | null;
	};

	let rows: RsvpRow[] = [];

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

		const addressParts = [
			contact?.address_street,
			contact?.address_city,
			contact?.address_state,
			contact?.address_country,
			contact?.address_postal_code
		].filter(Boolean);

		const eventAttendance: Record<string, boolean | null> = {};
		const eventInvited: Record<string, boolean> = {};
		let dietary: { selections: string[]; other: string } | null = null;
		let latestSubmission: string | null = null;

		for (const event of eventList) {
			eventInvited[event.id] = guestEventSet.has(`${guest.id}:${event.id}`);
			const rsvp = guest.rsvps?.find(
				(r: { event_id: string }) => r.event_id === event.id
			);
			eventAttendance[event.id] = rsvp?.attending ?? null;

			// Get dietary from reception RSVP (or any rsvp that has it)
			if (rsvp?.dietary_restrictions?.selections?.length || rsvp?.dietary_restrictions?.other) {
				dietary = rsvp.dietary_restrictions;
			}
			if (rsvp?.submitted_at && (!latestSubmission || rsvp.submitted_at > latestSubmission)) {
				latestSubmission = rsvp.submitted_at;
			}
		}

		rows.push({
			guestId: guest.id,
			guestName: `${guest.first_name} ${guest.last_name}`,
			householdName: household?.name ?? '',
			eventAttendance,
			eventInvited,
			dietaryRestrictions: dietary,
			email: contact?.email ?? null,
			phone: contact?.phone ?? null,
			address: addressParts.length > 0 ? addressParts.join(', ') : null,
			submittedAt: latestSubmission
		});
	}

	// Apply filters
	if (search) {
		const s = search.toLowerCase();
		rows = rows.filter((r) => r.guestName.toLowerCase().includes(s));
	}
	if (statusFilter === 'attending') {
		rows = rows.filter((r) => Object.values(r.eventAttendance).some((a) => a === true));
	} else if (statusFilter === 'declined') {
		rows = rows.filter((r) => Object.values(r.eventAttendance).some((a) => a === false));
	} else if (statusFilter === 'pending') {
		rows = rows.filter((r) => Object.values(r.eventAttendance).every((a) => a === null));
	}
	if (dietaryFilter) {
		rows = rows.filter((r) => r.dietaryRestrictions?.selections?.includes(dietaryFilter));
	}

	return { rows, events: eventList, search, statusFilter, dietaryFilter };
};

export const actions: Actions = {
	update: async ({ request }) => {
		const supabase = createServiceClient();
		const formData = await request.formData();

		const guest_id = formData.get('guest_id') as string;
		if (!guest_id) {
			return fail(400, { error: 'Guest is required.' });
		}

		// Parse dietary
		const dietarySelections = formData.getAll('dietary_selections') as string[];
		const dietaryOther = (formData.get('dietary_other') as string) ?? '';
		const dietary = { selections: dietarySelections, other: dietaryOther };

		// Parse per-event attendance
		for (const [key, value] of formData.entries()) {
			const match = key.match(/^events\[(.+?)\]\.attending$/);
			if (match) {
				const eventId = match[1];
				const attending = value === 'yes' ? true : value === 'no' ? false : null;

				// Find reception event for dietary assignment
				const receptionEventId = formData.get('reception_event_id') as string;
				const rsvpDietary =
					eventId === receptionEventId && attending
						? dietary
						: { selections: [] as string[], other: '' };

				const { error } = await supabase.from('rsvps').upsert(
					{
						guest_id,
						event_id: eventId,
						attending,
						dietary_restrictions: rsvpDietary,
						submitted_at: new Date().toISOString(),
						updated_at: new Date().toISOString()
					},
					{ onConflict: 'guest_id,event_id' }
				);

				if (error) {
					return fail(500, { error: 'Failed to update RSVP.' });
				}
			}
		}

		return { success: true };
	}
};
