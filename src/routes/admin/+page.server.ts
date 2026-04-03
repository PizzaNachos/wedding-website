import { createServiceClient } from '$lib/supabase-server';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const supabase = createServiceClient();

	const [{ data: guests }, { data: events }, { data: guestEvents }, { data: rsvps }] =
		await Promise.all([
			supabase.from('guests').select('id, first_name, last_name, is_child'),
			supabase.from('events').select('*').order('sort_order', { ascending: true }),
			supabase.from('guest_events').select('guest_id, event_id'),
			supabase.from('rsvps').select('guest_id, event_id, attending, dietary_restrictions')
		]);

	const guestList = guests ?? [];
	const eventList = events ?? [];
	const guestEventList = guestEvents ?? [];
	const rsvpList = rsvps ?? [];

	// Per-event stats
	const eventStats = eventList.map((event) => {
		const invitedGuestIds = new Set(
			guestEventList.filter((ge) => ge.event_id === event.id).map((ge) => ge.guest_id)
		);
		const eventRsvps = rsvpList.filter((r) => r.event_id === event.id);
		const attending = eventRsvps.filter((r) => r.attending === true).length;
		const declined = eventRsvps.filter((r) => r.attending === false).length;

		const attendingGuests = guestList.filter(
			(g) => invitedGuestIds.has(g.id) && eventRsvps.find((r) => r.guest_id === g.id)?.attending === true
		);

		return {
			eventName: event.name,
			eventId: event.id,
			invited: invitedGuestIds.size,
			attending,
			declined,
			pending: invitedGuestIds.size - eventRsvps.filter((r) => r.attending !== null).length,
			adults: attendingGuests.filter((g) => !g.is_child).length,
			children: attendingGuests.filter((g) => g.is_child).length
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

	return {
		eventStats,
		dietaryCounts,
		totalGuests: guestList.length
	};
};
