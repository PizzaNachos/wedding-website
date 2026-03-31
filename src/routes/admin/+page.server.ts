import { createServiceClient } from '$lib/supabase-server';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const supabase = createServiceClient();

	// Get all guests
	const { data: guests } = await supabase
		.from('guests')
		.select('id, first_name, last_name, is_child');

	// Get all RSVPs
	const { data: rsvps } = await supabase
		.from('rsvps')
		.select('guest_id, attending, dietary_restrictions, song_request');

	// Get ceremony interest
	const { data: ceremonyInterest } = await supabase
		.from('ceremony_interest')
		.select('guest_id, interest_level');

	const guestList = guests ?? [];
	const rsvpList = rsvps ?? [];
	const ceremonyList = ceremonyInterest ?? [];

	// Reception stats
	const rsvpByGuest = new Map(rsvpList.map((r) => [r.guest_id, r]));
	const attending = rsvpList.filter((r) => r.attending === true).length;
	const declined = rsvpList.filter((r) => r.attending === false).length;
	const pending = guestList.length - rsvpList.filter((r) => r.attending !== null).length;

	const attendingGuests = guestList.filter((g) => rsvpByGuest.get(g.id)?.attending === true);
	const adults = attendingGuests.filter((g) => !g.is_child).length;
	const children = attendingGuests.filter((g) => g.is_child).length;

	const receptionStats = {
		invited: guestList.length,
		attending,
		declined,
		pending,
		adults,
		children
	};

	// Ceremony interest stats
	const ceremonyStats = {
		yes: ceremonyList.filter((c) => c.interest_level === 'yes').length,
		maybe: ceremonyList.filter((c) => c.interest_level === 'maybe').length,
		not_likely: ceremonyList.filter((c) => c.interest_level === 'not_likely').length,
		other: ceremonyList.filter((c) => c.interest_level === 'other').length,
		no_response: guestList.filter((g) => !g.is_child).length - ceremonyList.length
	};

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

	return {
		receptionStats,
		ceremonyStats,
		dietaryCounts,
		songRequests,
		totalGuests: guestList.length
	};
};
