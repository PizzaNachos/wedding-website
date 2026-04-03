import { error } from '@sveltejs/kit';
import { supabase } from '$lib/supabase';
import { createServiceClient } from '$lib/supabase-server';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const { code } = params;

	const { data: household, error: householdError } = await supabase
		.from('households')
		.select('*, guests(*)')
		.eq('unique_code', code)
		.single();

	if (householdError || !household) {
		throw error(404, 'Invitation not found. Please check your link and try again.');
	}

	const guestIds = household.guests.map((g: { id: string }) => g.id);

	const [{ data: events }, { data: guestEvents }, { data: existingRsvps }] = await Promise.all([
		supabase.from('events').select('*').order('sort_order', { ascending: true }),
		supabase.from('guest_events').select('*').in('guest_id', guestIds),
		supabase.from('rsvps').select('*').in('guest_id', guestIds)
	]);

	return {
		household,
		events: events ?? [],
		guestEvents: guestEvents ?? [],
		existingRsvps: existingRsvps ?? []
	};
};

export const actions: Actions = {
	default: async ({ request, params }) => {
		const { code } = params;

		const { data: household } = await supabase
			.from('households')
			.select('*, guests(id, is_child)')
			.eq('unique_code', code)
			.single();

		if (!household) {
			throw error(404, 'Invitation not found');
		}

		const validGuestIds = new Set<string>(household.guests.map((g: { id: string }) => g.id));
		const hasAdults = household.guests.some((g: { is_child: boolean }) => !g.is_child);
		const formData = await request.formData();

		// Get the reception event ID from hidden field
		const receptionEventId = String(formData.get('reception_event_id') ?? '');

		// Fetch valid guest_events to validate submissions
		const { data: validGuestEvents } = await supabase
			.from('guest_events')
			.select('guest_id, event_id')
			.in('guest_id', [...validGuestIds]);

		const validPairs = new Set(
			(validGuestEvents ?? []).map((ge) => `${ge.guest_id}:${ge.event_id}`)
		);

		// Check if this is a first-time submission
		const { data: existingRsvps } = await supabase
			.from('rsvps')
			.select('guest_id')
			.in('guest_id', [...validGuestIds]);
		const isFirstSubmission = !existingRsvps?.length;

		// 1. Parse household contact info
		const householdContact = {
			email: String(formData.get('household.email') ?? '').trim(),
			phone: String(formData.get('household.phone') ?? '').trim() || null,
			address_street: String(formData.get('household.address_street') ?? '').trim() || null,
			address_city: String(formData.get('household.address_city') ?? '').trim() || null,
			address_state: String(formData.get('household.address_state') ?? '').trim() || null,
			address_country: String(formData.get('household.address_country') ?? '').trim() || null,
			address_postal_code:
				String(formData.get('household.address_postal_code') ?? '').trim() || null
		};

		// Validate email on first submission
		if (isFirstSubmission) {
			if (hasAdults && !householdContact.email) {
				return { success: false, message: 'Please enter an email address.' };
			}
			if (householdContact.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(householdContact.email)) {
				return { success: false, message: 'Please enter a valid email address.' };
			}
		}

		// 2. Parse per-guest, per-event data
		const guestEventAttending = new Map<string, Map<string, boolean>>();
		const guestDietary = new Map<string, { selections: string[]; other: string }>();

		for (const [key, value] of formData.entries()) {
			// Per-event attendance: guests[{guestId}].events[{eventId}].attending
			const attendingMatch = key.match(/^guests\[(.+?)\]\.events\[(.+?)\]\.attending$/);
			if (attendingMatch) {
				const [, guestId, eventId] = attendingMatch;
				if (validGuestIds.has(guestId) && validPairs.has(`${guestId}:${eventId}`)) {
					if (!guestEventAttending.has(guestId)) guestEventAttending.set(guestId, new Map());
					guestEventAttending.get(guestId)!.set(eventId, value === 'yes');
				}
			}

			// Dietary restrictions (per-guest)
			const dietaryMatch = key.match(/^guests\[(.+?)\]\.dietary\[(.+?)\]$/);
			if (dietaryMatch) {
				const [, guestId, restriction] = dietaryMatch;
				if (validGuestIds.has(guestId)) {
					if (!guestDietary.has(guestId)) {
						guestDietary.set(guestId, { selections: [], other: '' });
					}
					if (restriction === 'other') {
						guestDietary.get(guestId)!.other = String(value);
					} else {
						guestDietary.get(guestId)!.selections.push(restriction);
					}
				}
			}
		}

		// 3. Upsert household contact info (first submission only)
		const serviceClient = createServiceClient();
		if (isFirstSubmission && (householdContact.email || !hasAdults)) {
			const { error: contactError } = await serviceClient.from('household_contact_info').upsert(
				{
					household_id: household.id,
					email: householdContact.email || '',
					phone: householdContact.phone,
					address_street: householdContact.address_street,
					address_city: householdContact.address_city,
					address_state: householdContact.address_state,
					address_country: householdContact.address_country,
					address_postal_code: householdContact.address_postal_code,
					updated_at: new Date().toISOString()
				},
				{ onConflict: 'household_id' }
			);

			if (contactError) {
				console.error('Contact info upsert error:', contactError);
				return {
					success: false,
					message: 'Something went wrong saving contact info. Please try again.'
				};
			}
		}

		// 4. Upsert RSVPs (one per guest per event)
		for (const [guestId, eventMap] of guestEventAttending) {
			for (const [eventId, attending] of eventMap) {
				// Dietary restrictions go on the reception RSVP row only, and only if attending
				const dietary =
					eventId === receptionEventId && attending
						? (guestDietary.get(guestId) ?? { selections: [], other: '' })
						: { selections: [], other: '' };

				const { error: rsvpError } = await supabase.from('rsvps').upsert(
					{
						guest_id: guestId,
						event_id: eventId,
						attending,
						dietary_restrictions: dietary,
						submitted_at: new Date().toISOString(),
						updated_at: new Date().toISOString()
					},
					{ onConflict: 'guest_id,event_id' }
				);

				if (rsvpError) {
					console.error('RSVP upsert error:', rsvpError);
					return { success: false, message: 'Something went wrong. Please try again.' };
				}
			}
		}

		return { success: true, message: 'Thank you! Your RSVP has been submitted.' };
	}
};
