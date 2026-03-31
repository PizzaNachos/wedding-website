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

	const { data: existingRsvps } = await supabase
		.from('rsvps')
		.select('*')
		.in('guest_id', guestIds);

	const { data: existingCeremonyInterest } = await supabase
		.from('ceremony_interest')
		.select('*')
		.in('guest_id', guestIds);

	return {
		household,
		existingRsvps: existingRsvps ?? [],
		existingCeremonyInterest: existingCeremonyInterest ?? []
	};
};

const VALID_CEREMONY_LEVELS = new Set(['yes', 'maybe', 'not_likely', 'other']);

export const actions: Actions = {
	default: async ({ request, params }) => {
		const { code } = params;

		// Verify the household code is valid
		const { data: household } = await supabase
			.from('households')
			.select('*, guests(id, is_child)')
			.eq('unique_code', code)
			.single();

		if (!household) {
			throw error(404, 'Invitation not found');
		}

		const validGuestIds = new Set(household.guests.map((g: { id: string }) => g.id));
		const childGuestIds = new Set(
			household.guests
				.filter((g: { is_child: boolean }) => g.is_child)
				.map((g: { id: string }) => g.id)
		);
		const hasAdults = household.guests.some((g: { is_child: boolean }) => !g.is_child);
		const formData = await request.formData();

		// Check if this is a first-time submission (no existing RSVPs)
		const { data: existingRsvps } = await supabase
			.from('rsvps')
			.select('guest_id')
			.in('guest_id', [...validGuestIds]);
		const isFirstSubmission = !existingRsvps?.length;

		// 1. Parse household contact info (only on first submission)
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

		// Validate email (only on first submission when contact fields are shown)
		if (isFirstSubmission) {
			if (hasAdults && !householdContact.email) {
				return { success: false, message: 'Please enter an email address.' };
			}
			if (householdContact.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(householdContact.email)) {
				return { success: false, message: 'Please enter a valid email address.' };
			}
		}

		// 2. Parse per-guest data
		const guestAttending = new Map<string, boolean>();
		const guestCeremony = new Map<string, { level: string; otherText: string }>();
		const guestDietary = new Map<string, { selections: string[]; other: string }>();
		const guestSongs = new Map<string, string>();

		for (const [key, value] of formData.entries()) {
			// Reception attending
			const attendingMatch = key.match(/^guests\[(.+?)\]\.attending$/);
			if (attendingMatch) {
				const guestId = attendingMatch[1];
				if (validGuestIds.has(guestId)) {
					guestAttending.set(guestId, value === 'yes');
				}
			}

			// Ceremony interest (adults)
			const ceremonyMatch = key.match(/^guests\[(.+?)\]\.ceremony$/);
			if (ceremonyMatch) {
				const guestId = ceremonyMatch[1];
				if (validGuestIds.has(guestId)) {
					guestCeremony.set(guestId, {
						level: String(value),
						otherText: ''
					});
				}
			}

			const ceremonyOtherMatch = key.match(/^guests\[(.+?)\]\.ceremony_other_text$/);
			if (ceremonyOtherMatch) {
				const guestId = ceremonyOtherMatch[1];
				const existing = guestCeremony.get(guestId);
				if (existing) existing.otherText = String(value).trim();
			}

			// Ceremony child opt-in
			const childOptinMatch = key.match(/^guests\[(.+?)\]\.ceremony_child_optin$/);
			if (childOptinMatch) {
				const guestId = childOptinMatch[1];
				if (validGuestIds.has(guestId) && value === 'true') {
					guestCeremony.set(guestId, { level: 'yes', otherText: '' });
				}
			}

			// Dietary restrictions
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

			// Song request
			const songMatch = key.match(/^guests\[(.+?)\]\.song_request$/);
			if (songMatch) {
				const guestId = songMatch[1];
				if (validGuestIds.has(guestId)) {
					guestSongs.set(guestId, String(value));
				}
			}
		}

		// 3. Upsert household contact info (only on first submission)
		const serviceClient = createServiceClient();
		if (isFirstSubmission && (householdContact.email || !hasAdults)) {
			const { error: contactError } = await serviceClient
				.from('household_contact_info')
				.upsert(
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

		// 4. Upsert RSVPs (one per guest)
		for (const guestId of validGuestIds) {
			const attending = guestAttending.get(guestId) ?? null;
			const dietary = guestDietary.get(guestId) ?? { selections: [], other: '' };
			const song = guestSongs.get(guestId) ?? '';

			const { error: rsvpError } = await supabase.from('rsvps').upsert(
				{
					guest_id: guestId,
					attending,
					dietary_restrictions: dietary,
					song_request: song,
					submitted_at: new Date().toISOString(),
					updated_at: new Date().toISOString()
				},
				{ onConflict: 'guest_id' }
			);

			if (rsvpError) {
				console.error('RSVP upsert error:', rsvpError);
				return { success: false, message: 'Something went wrong. Please try again.' };
			}
		}

		// 5. Upsert ceremony interest
		for (const [guestId, ceremonyData] of guestCeremony) {
			if (!validGuestIds.has(guestId)) continue;
			if (!VALID_CEREMONY_LEVELS.has(ceremonyData.level)) continue;

			const { error: ceremonyError } = await supabase.from('ceremony_interest').upsert(
				{
					guest_id: guestId,
					interest_level: ceremonyData.level,
					other_text: ceremonyData.level === 'other' ? ceremonyData.otherText : null,
					updated_at: new Date().toISOString()
				},
				{ onConflict: 'guest_id' }
			);

			if (ceremonyError) {
				console.error('Ceremony interest upsert error:', ceremonyError);
				return {
					success: false,
					message: 'Something went wrong saving ceremony interest. Please try again.'
				};
			}
		}

		// 6. Clean up ceremony interest for children NOT opted in
		for (const guestId of childGuestIds) {
			if (!guestCeremony.has(guestId)) {
				await supabase.from('ceremony_interest').delete().eq('guest_id', guestId);
			}
		}

		return { success: true, message: 'Thank you! Your RSVP has been submitted.' };
	}
};
