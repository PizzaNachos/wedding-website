import { createServiceClient } from '$lib/supabase-server';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const supabase = createServiceClient();

	// Get all events
	const { data: events } = await supabase
		.from('events')
		.select('id, name')
		.order('date', { ascending: true });

	// Get all guests with their event assignments and RSVPs
	const { data: guests } = await supabase
		.from('guests')
		.select('id, first_name, last_name, is_child, guest_events(event_id)');

	// Get all RSVPs
	const { data: rsvps } = await supabase
		.from('rsvps')
		.select('guest_id, event_id, attending, dietary_restrictions, song_request');

	const eventList = events ?? [];
	const guestList = guests ?? [];
	const rsvpList = rsvps ?? [];

	// Build per-event stats
	const eventStats = eventList.map((event) => {
		// Find all guests invited to this event
		const invitedGuestIds = new Set(
			guestList
				.filter((g) => g.guest_events?.some((ge: { event_id: string }) => ge.event_id === event.id))
				.map((g) => g.id)
		);

		const eventRsvps = rsvpList.filter(
			(r) => r.event_id === event.id && invitedGuestIds.has(r.guest_id)
		);

		const attending = eventRsvps.filter((r) => r.attending === true).length;
		const declined = eventRsvps.filter((r) => r.attending === false).length;
		const pending = invitedGuestIds.size - eventRsvps.filter((r) => r.attending !== null).length;

		// Headcount breakdown for attending guests
		const attendingGuestIds = new Set(
			eventRsvps.filter((r) => r.attending === true).map((r) => r.guest_id)
		);
		const attendingGuests = guestList.filter((g) => attendingGuestIds.has(g.id));
		const adults = attendingGuests.filter((g) => !g.is_child).length;
		const children = attendingGuests.filter((g) => g.is_child).length;

		return {
			eventName: event.name,
			invited: invitedGuestIds.size,
			attending,
			declined,
			pending,
			adults,
			children
		};
	});

	// Dietary restriction summary (across all attending RSVPs)
	const dietaryCounts: Record<string, number> = {};
	for (const rsvp of rsvpList) {
		if (rsvp.attending !== true) continue;
		const dr = rsvp.dietary_restrictions as { selections?: string[]; other?: string } | null;
		if (!dr?.selections) continue;
		for (const restriction of dr.selections) {
			dietaryCounts[restriction] = (dietaryCounts[restriction] || 0) + 1;
		}
		if (dr.other?.trim()) {
			const key = `Other: ${dr.other.trim()}`;
			dietaryCounts[key] = (dietaryCounts[key] || 0) + 1;
		}
	}

	// Song requests
	const songRequests = rsvpList
		.filter((r) => r.song_request?.trim())
		.map((r) => {
			const guest = guestList.find((g) => g.id === r.guest_id);
			return {
				guest: guest ? `${guest.first_name} ${guest.last_name}` : 'Unknown',
				song: r.song_request
			};
		});

	// Overall totals
	const totalGuests = guestList.length;
	const totalHouseholds = new Set(guestList.map((g) => g.id)).size; // approximate

	return {
		eventStats,
		dietaryCounts,
		songRequests,
		totalGuests
	};
};
