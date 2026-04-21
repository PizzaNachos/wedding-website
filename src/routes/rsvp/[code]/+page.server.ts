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
	submitRsvp: async ({ request, params }) => {
		const { code } = params;

		const { data: household } = await supabase
			.from('households')
			.select('*, guests(id, is_child, allows_plus_one, is_plus_one, plus_one_of)')
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

		// 5. Auto-decline plus-ones if host declined all events
		const hostsWithPlusOne = household.guests.filter(
			(g: { id: string; allows_plus_one: boolean }) => g.allows_plus_one
		);

		for (const host of hostsWithPlusOne) {
			const hostEvents = guestEventAttending.get(host.id);
			if (!hostEvents) continue;

			const allDeclined = [...hostEvents.values()].every((a) => a === false);
			if (!allDeclined) continue;

			// Find the plus-one guest for this host
			const { data: plusOneGuests } = await supabase
				.from('guests')
				.select('id')
				.eq('plus_one_of', host.id);

			if (!plusOneGuests?.length) continue;

			const plusOneId = plusOneGuests[0].id;

			// Get plus-one's event assignments
			const { data: plusOneEvents } = await supabase
				.from('guest_events')
				.select('event_id')
				.eq('guest_id', plusOneId);

			for (const pe of plusOneEvents ?? []) {
				await supabase.from('rsvps').upsert(
					{
						guest_id: plusOneId,
						event_id: pe.event_id,
						attending: false,
						dietary_restrictions: { selections: [], other: '' },
						submitted_at: new Date().toISOString(),
						updated_at: new Date().toISOString()
					},
					{ onConflict: 'guest_id,event_id' }
				);
			}
		}

		return { success: true, message: 'Thank you! Your RSVP has been submitted.' };
	},

	addPlusOne: async ({ request, params }) => {
		const { code } = params;
		const serviceClient = createServiceClient();

		const { data: household } = await supabase
			.from('households')
			.select('*, guests(id, allows_plus_one, is_plus_one, plus_one_of)')
			.eq('unique_code', code)
			.single();

		if (!household) {
			throw error(404, 'Invitation not found');
		}

		const formData = await request.formData();
		const hostGuestId = String(formData.get('host_guest_id') ?? '');
		const firstName = String(formData.get('plus_one_first_name') ?? '').trim();
		const lastName = String(formData.get('plus_one_last_name') ?? '').trim();

		if (!firstName || !lastName) {
			return { success: false, message: 'Please enter a first and last name for your guest.', action: 'addPlusOne' };
		}

		// Validate host belongs to household and allows plus one
		const host = household.guests.find(
			(g: { id: string; allows_plus_one: boolean }) => g.id === hostGuestId && g.allows_plus_one
		);
		if (!host) {
			return { success: false, message: 'Invalid guest.', action: 'addPlusOne' };
		}

		// Check no existing plus-one
		const existingPlusOne = household.guests.find(
			(g: { plus_one_of: string | null }) => g.plus_one_of === hostGuestId
		);
		if (existingPlusOne) {
			return { success: false, message: 'A plus one has already been added.', action: 'addPlusOne' };
		}

		// Insert plus-one guest
		const { data: newGuest, error: insertError } = await serviceClient
			.from('guests')
			.insert({
				household_id: household.id,
				first_name: firstName,
				last_name: lastName,
				is_child: false,
				is_plus_one: true,
				plus_one_of: hostGuestId,
				allows_plus_one: false
			})
			.select('id')
			.single();

		if (insertError || !newGuest) {
			console.error('Plus-one insert error:', insertError);
			return { success: false, message: 'Something went wrong. Please try again.', action: 'addPlusOne' };
		}

		// Copy host's guest_events
		const { data: hostEvents } = await supabase
			.from('guest_events')
			.select('event_id')
			.eq('guest_id', hostGuestId);

		if (hostEvents?.length) {
			const rows = hostEvents.map((ge) => ({
				guest_id: newGuest.id,
				event_id: ge.event_id
			}));
			await serviceClient.from('guest_events').insert(rows);

			// Create pending RSVP rows
			const rsvpRows = hostEvents.map((ge) => ({
				guest_id: newGuest.id,
				event_id: ge.event_id,
				attending: null,
				dietary_restrictions: { selections: [], other: '' },
				updated_at: new Date().toISOString()
			}));
			await supabase.from('rsvps').insert(rsvpRows);
		}

		return { success: true, action: 'addPlusOne' };
	},

	removePlusOne: async ({ request, params }) => {
		const { code } = params;
		const serviceClient = createServiceClient();

		const { data: household } = await supabase
			.from('households')
			.select('*, guests(id, is_plus_one)')
			.eq('unique_code', code)
			.single();

		if (!household) {
			throw error(404, 'Invitation not found');
		}

		const formData = await request.formData();
		const plusOneId = String(formData.get('plus_one_id') ?? '');

		const plusOne = household.guests.find(
			(g: { id: string; is_plus_one: boolean }) => g.id === plusOneId && g.is_plus_one
		);
		if (!plusOne) {
			return { success: false, message: 'Invalid guest.', action: 'removePlusOne' };
		}

		const { error: deleteError } = await serviceClient
			.from('guests')
			.delete()
			.eq('id', plusOneId);

		if (deleteError) {
			console.error('Plus-one delete error:', deleteError);
			return { success: false, message: 'Something went wrong. Please try again.', action: 'removePlusOne' };
		}

		return { success: true, action: 'removePlusOne' };
	},

	updatePlusOneName: async ({ request, params }) => {
		const { code } = params;
		const serviceClient = createServiceClient();

		const { data: household } = await supabase
			.from('households')
			.select('*, guests(id, is_plus_one)')
			.eq('unique_code', code)
			.single();

		if (!household) {
			throw error(404, 'Invitation not found');
		}

		const formData = await request.formData();
		const plusOneId = String(formData.get('plus_one_id') ?? '');
		const firstName = String(formData.get('plus_one_first_name') ?? '').trim();
		const lastName = String(formData.get('plus_one_last_name') ?? '').trim();

		if (!firstName || !lastName) {
			return { success: false, message: 'Please enter a first and last name.', action: 'updatePlusOneName' };
		}

		const plusOne = household.guests.find(
			(g: { id: string; is_plus_one: boolean }) => g.id === plusOneId && g.is_plus_one
		);
		if (!plusOne) {
			return { success: false, message: 'Invalid guest.', action: 'updatePlusOneName' };
		}

		const { error: updateError } = await serviceClient
			.from('guests')
			.update({ first_name: firstName, last_name: lastName })
			.eq('id', plusOneId);

		if (updateError) {
			console.error('Plus-one update error:', updateError);
			return { success: false, message: 'Something went wrong. Please try again.', action: 'updatePlusOneName' };
		}

		return { success: true, action: 'updatePlusOneName' };
	}
};
