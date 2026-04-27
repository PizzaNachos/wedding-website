import { createServiceClient } from '$lib/supabase-server';
import type { PageServerLoad } from './$types';

type AuditMetadata = {
	affected_guest_ids?: string[];
	affected_event_ids?: string[];
	[key: string]: unknown;
};

type AuditSnapshot = {
	household?: { id: string; name: string; unique_code: string };
	guests?: { id: string; first_name: string; last_name: string }[];
};

export const load: PageServerLoad = async ({ url }) => {
	const supabase = createServiceClient();

	let householdFilter = url.searchParams.get('household') ?? '';
	const guestFilter = url.searchParams.get('guest') ?? '';

	if (!householdFilter && guestFilter) {
		const { data: guest } = await supabase
			.from('guests')
			.select('household_id')
			.eq('id', guestFilter)
			.single();

		householdFilter = guest?.household_id ?? '';
	}

	let auditQuery = supabase
		.from('rsvp_audit_events')
		.select(
			'id, created_at, household_id, guest_id, source, action, visitor_id, admin_user_id, snapshot, metadata'
		)
		.order('created_at', { ascending: false })
		.limit(100);

	if (householdFilter) {
		auditQuery = auditQuery.eq('household_id', householdFilter);
	}

	const [{ data: auditEvents }, { data: households }, { data: guests }] = await Promise.all([
		auditQuery,
		supabase.from('households').select('id, name').order('name', { ascending: true }),
		householdFilter
			? supabase
					.from('guests')
					.select('id, first_name, last_name')
					.eq('household_id', householdFilter)
					.order('last_name', { ascending: true })
			: Promise.resolve({ data: [] })
	]);

	const filteredEvents = guestFilter
		? (auditEvents ?? []).filter((event) => {
				const metadata = event.metadata as AuditMetadata | null;
				return (
					event.guest_id === guestFilter || metadata?.affected_guest_ids?.includes(guestFilter)
				);
			})
		: (auditEvents ?? []);

	return {
		auditEvents: filteredEvents.map((event) => ({
			...event,
			snapshotJson: JSON.stringify(event.snapshot, null, 2),
			metadataJson: JSON.stringify(event.metadata, null, 2),
			metadata: event.metadata as AuditMetadata,
			snapshot: event.snapshot as AuditSnapshot
		})),
		households: households ?? [],
		guests: guests ?? [],
		householdFilter,
		guestFilter
	};
};
