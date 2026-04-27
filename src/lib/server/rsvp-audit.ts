import type { SupabaseClient } from '@supabase/supabase-js';

type AuditSource = 'public' | 'admin';

type AuditMetadata = Record<string, unknown>;

export interface RsvpAuditEventInput {
	householdId: string;
	guestId?: string | null;
	source: AuditSource;
	action: string;
	visitorId?: string | null;
	adminUserId?: string | null;
	metadata?: AuditMetadata;
}

export async function recordRsvpAuditEvent(supabase: SupabaseClient, input: RsvpAuditEventInput) {
	try {
		const snapshot = await buildRsvpAuditSnapshot(supabase, input.householdId);

		const { error } = await supabase.from('rsvp_audit_events').insert({
			household_id: input.householdId,
			guest_id: input.guestId ?? null,
			source: input.source,
			action: input.action,
			visitor_id: input.visitorId ?? null,
			admin_user_id: input.adminUserId ?? null,
			snapshot,
			metadata: input.metadata ?? {}
		});

		if (error) {
			console.error('RSVP audit insert error:', error);
		}
	} catch (error) {
		console.error('RSVP audit insert error:', error);
	}
}

async function buildRsvpAuditSnapshot(supabase: SupabaseClient, householdId: string) {
	const { data: household, error: householdError } = await supabase
		.from('households')
		.select(
			'id, name, unique_code, created_at, guests(id, household_id, first_name, last_name, is_child, child_meal, allows_plus_one, is_plus_one, plus_one_of, created_at)'
		)
		.eq('id', householdId)
		.single();

	if (householdError || !household) {
		throw householdError ?? new Error('Household not found while building RSVP audit snapshot.');
	}

	const guests = household.guests ?? [];
	const guestIds = guests.map((guest: { id: string }) => guest.id);

	const [{ data: contactInfo }, { data: guestEvents }, { data: rsvps }] = await Promise.all([
		supabase
			.from('household_contact_info')
			.select('*')
			.eq('household_id', householdId)
			.maybeSingle(),
		guestIds.length
			? supabase
					.from('guest_events')
					.select('guest_id, event_id, events(id, name, date, time, location, address, sort_order)')
					.in('guest_id', guestIds)
			: Promise.resolve({ data: [] }),
		guestIds.length
			? supabase
					.from('rsvps')
					.select(
						'id, guest_id, event_id, attending, dietary_restrictions, submitted_at, updated_at'
					)
					.in('guest_id', guestIds)
					.order('updated_at', { ascending: false })
			: Promise.resolve({ data: [] })
	]);

	return {
		captured_at: new Date().toISOString(),
		household: {
			id: household.id,
			name: household.name,
			unique_code: household.unique_code,
			created_at: household.created_at
		},
		household_contact_info: contactInfo ?? null,
		guests,
		guest_events: guestEvents ?? [],
		rsvps: rsvps ?? []
	};
}
