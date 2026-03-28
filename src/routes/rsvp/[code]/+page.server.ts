import { error } from '@sveltejs/kit';
import { supabase } from '$lib/supabase';
import { createServiceClient } from '$lib/supabase-server';
import { US_STATES } from '$lib/types';
import type { PageServerLoad, Actions } from './$types';

const validStateValues = new Set<string>(US_STATES.map((s) => s.value));

export const load: PageServerLoad = async ({ params }) => {
	const { code } = params;

	const { data: household, error: householdError } = await supabase
		.from('households')
		.select('*, guests(*, guest_events(*, events(*)))')
		.eq('unique_code', code)
		.single();

	if (householdError || !household) {
		throw error(404, 'Invitation not found. Please check your link and try again.');
	}

	const guestIds = household.guests.map((g: { id: string }) => g.id);

	const { data: existingRsvps } = await supabase
		.from('rsvps')
		.select('*')
		.in('guest_id', guestIds);

	// Fetch contact info using service role (anon can't SELECT this table)
	const serviceClient = createServiceClient();
	const { data: existingContactInfo } = await serviceClient
		.from('guest_contact_info')
		.select('*')
		.in('guest_id', guestIds);

	return {
		household,
		existingRsvps: existingRsvps ?? [],
		existingContactInfo: existingContactInfo ?? []
	};
};

export const actions: Actions = {
	default: async ({ request, params }) => {
		const { code } = params;

		// Verify the household code is valid
		const { data: household } = await supabase
			.from('households')
			.select('*, guests(id)')
			.eq('unique_code', code)
			.single();

		if (!household) {
			throw error(404, 'Invitation not found');
		}

		const validGuestIds = new Set(household.guests.map((g: { id: string }) => g.id));
		const formData = await request.formData();

		// Parse all guest RSVPs from form data
		// Form fields are named: guests[guestId].events[eventId].attending, etc.
		const rsvpUpdates: Array<{
			guest_id: string;
			event_id: string;
			attending: boolean;
			dietary_restrictions: { selections: string[]; other: string };
			song_request: string;
		}> = [];

		// Collect all guest-event pairs from the form
		const guestEventMap = new Map<string, Map<string, boolean>>();
		const guestDietaryMap = new Map<string, { selections: string[]; other: string }>();
		const guestSongMap = new Map<string, string>();
		const guestContactMap = new Map<
			string,
			{
				email: string;
				phone: string;
				address_street: string;
				address_unit: string;
				address_city: string;
				address_state: string;
				address_zip: string;
			}
		>();

		const contactFields = new Set([
			'email',
			'phone',
			'address_street',
			'address_unit',
			'address_city',
			'address_state',
			'address_zip'
		]);

		for (const [key, value] of formData.entries()) {
			const attendingMatch = key.match(/^guests\[(.+?)\]\.events\[(.+?)\]\.attending$/);
			if (attendingMatch) {
				const [, guestId, eventId] = attendingMatch;
				if (!guestEventMap.has(guestId)) guestEventMap.set(guestId, new Map());
				guestEventMap.get(guestId)!.set(eventId, value === 'yes');
			}

			const dietaryMatch = key.match(/^guests\[(.+?)\]\.dietary\[(.+?)\]$/);
			if (dietaryMatch) {
				const [, guestId, restriction] = dietaryMatch;
				if (!guestDietaryMap.has(guestId)) {
					guestDietaryMap.set(guestId, { selections: [], other: '' });
				}
				if (restriction === 'other') {
					guestDietaryMap.get(guestId)!.other = String(value);
				} else {
					guestDietaryMap.get(guestId)!.selections.push(restriction);
				}
			}

			const songMatch = key.match(/^guests\[(.+?)\]\.song_request$/);
			if (songMatch) {
				const [, guestId] = songMatch;
				guestSongMap.set(guestId, String(value));
			}

			const contactMatch = key.match(/^guests\[(.+?)\]\.(\w+)$/);
			if (contactMatch) {
				const [, guestId, field] = contactMatch;
				if (contactFields.has(field)) {
					if (!guestContactMap.has(guestId)) {
						guestContactMap.set(guestId, {
							email: '',
							phone: '',
							address_street: '',
							address_unit: '',
							address_city: '',
							address_state: '',
							address_zip: ''
						});
					}
					(guestContactMap.get(guestId)! as Record<string, string>)[field] =
						String(value).trim();
				}
			}
		}

		// Build upsert records
		for (const [guestId, events] of guestEventMap) {
			if (!validGuestIds.has(guestId)) continue;

			for (const [eventId, attending] of events) {
				rsvpUpdates.push({
					guest_id: guestId,
					event_id: eventId,
					attending,
					dietary_restrictions: guestDietaryMap.get(guestId) ?? {
						selections: [],
						other: ''
					},
					song_request: guestSongMap.get(guestId) ?? ''
				});
			}
		}

		// Upsert all RSVPs
		for (const rsvp of rsvpUpdates) {
			const { error: upsertError } = await supabase.from('rsvps').upsert(
				{
					...rsvp,
					submitted_at: new Date().toISOString(),
					updated_at: new Date().toISOString()
				},
				{ onConflict: 'guest_id,event_id' }
			);

			if (upsertError) {
				console.error('RSVP upsert error:', upsertError);
				return { success: false, message: 'Something went wrong. Please try again.' };
			}
		}

		// Upsert contact info for adult guests
		const serviceClient = createServiceClient();
		for (const [guestId, contact] of guestContactMap) {
			if (!validGuestIds.has(guestId)) continue;
			if (!contact.email) continue;

			// Validate email format
			if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) {
				return { success: false, message: 'Please enter a valid email address.' };
			}

			// Validate state if provided
			if (contact.address_state && !validStateValues.has(contact.address_state)) {
				return { success: false, message: 'Please select a valid state.' };
			}

			// Validate ZIP if provided
			if (contact.address_zip && !/^\d{5}(-\d{4})?$/.test(contact.address_zip)) {
				return { success: false, message: 'Please enter a valid ZIP code.' };
			}

			const { error: contactError } = await serviceClient.from('guest_contact_info').upsert(
				{
					guest_id: guestId,
					email: contact.email,
					phone: contact.phone || null,
					address_street: contact.address_street || null,
					address_unit: contact.address_unit || null,
					address_city: contact.address_city || null,
					address_state: contact.address_state || null,
					address_zip: contact.address_zip || null,
					updated_at: new Date().toISOString()
				},
				{ onConflict: 'guest_id' }
			);

			if (contactError) {
				console.error('Contact info upsert error:', contactError);
				return {
					success: false,
					message: 'Something went wrong saving contact info. Please try again.'
				};
			}
		}

		return { success: true, message: 'Thank you! Your RSVP has been submitted.' };
	}
};
