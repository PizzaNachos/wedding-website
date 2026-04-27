<script lang="ts">
	let { data } = $props();

	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		});
	}

	function shortId(value: string | null): string {
		if (!value) return 'Unknown';
		return value.slice(0, 8);
	}

	function sourceClasses(source: string): string {
		return source === 'admin' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700';
	}

	function affectedGuests(event: {
		guest_id: string | null;
		metadata?: { affected_guest_ids?: string[] };
		snapshot?: { guests?: { id: string; first_name: string; last_name: string }[] };
	}): string {
		const ids = new Set<string>();
		if (event.guest_id) ids.add(event.guest_id);
		for (const id of event.metadata?.affected_guest_ids ?? []) ids.add(id);

		const guests = event.snapshot?.guests ?? [];
		const names = [...ids]
			.map((id) => guests.find((guest) => guest.id === id))
			.filter(Boolean)
			.map((guest) => `${guest!.first_name} ${guest!.last_name}`);

		return names.length ? names.join(', ') : 'Household';
	}

	function actorLabel(event: {
		source: string;
		visitor_id: string | null;
		admin_user_id: string | null;
	}): string {
		if (event.source === 'admin') return `Admin ${shortId(event.admin_user_id)}`;
		return `Visitor ${shortId(event.visitor_id)}`;
	}
</script>

<svelte:head>
	<title>RSVP History - Admin</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<a href="/admin/rsvps" class="text-sm text-gray-500 hover:text-gray-700">&larr; RSVPs</a>
			<h1 class="mt-2 text-2xl font-semibold text-gray-900">RSVP History</h1>
		</div>
	</div>

	<form
		method="GET"
		class="flex flex-wrap gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200"
	>
		<select name="household" class="rounded-lg border border-gray-300 px-3 py-2 text-sm">
			<option value="">All households</option>
			{#each data.households as household}
				<option value={household.id} selected={household.id === data.householdFilter}>
					{household.name}
				</option>
			{/each}
		</select>

		<select
			name="guest"
			class="rounded-lg border border-gray-300 px-3 py-2 text-sm"
			disabled={!data.householdFilter}
		>
			<option value="">All guests</option>
			{#each data.guests as guest}
				<option value={guest.id} selected={guest.id === data.guestFilter}>
					{guest.first_name}
					{guest.last_name}
				</option>
			{/each}
		</select>

		<button
			type="submit"
			class="rounded-lg bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-800"
		>
			Apply
		</button>
		<a
			href="/admin/rsvps/history"
			class="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
		>
			Clear
		</a>
	</form>

	<p class="text-sm text-gray-500">
		{data.auditEvents.length} audit event{data.auditEvents.length === 1 ? '' : 's'}
	</p>

	<div class="space-y-4">
		{#each data.auditEvents as event}
			<article class="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
				<div class="flex flex-wrap items-start justify-between gap-3">
					<div>
						<div class="flex flex-wrap items-center gap-2">
							<span
								class="rounded-full px-2 py-0.5 text-xs font-medium {sourceClasses(event.source)}"
							>
								{event.source}
							</span>
							<span class="text-sm font-medium text-gray-900">{event.action}</span>
							<span class="text-sm text-gray-500">{formatDate(event.created_at)}</span>
						</div>
						<p class="mt-2 text-sm text-gray-700">
							{event.snapshot?.household?.name ?? 'Unknown household'}: {affectedGuests(event)}
						</p>
						<p class="mt-1 text-xs text-gray-500">{actorLabel(event)}</p>
					</div>
				</div>

				<div class="mt-4 grid gap-3 lg:grid-cols-2">
					<details class="rounded-lg border border-gray-200">
						<summary class="cursor-pointer px-3 py-2 text-sm font-medium text-gray-700">
							Metadata
						</summary>
						<pre
							class="overflow-x-auto border-t border-gray-200 p-3 text-xs text-gray-600">{event.metadataJson}</pre>
					</details>
					<details class="rounded-lg border border-gray-200">
						<summary class="cursor-pointer px-3 py-2 text-sm font-medium text-gray-700">
							Snapshot
						</summary>
						<pre
							class="max-h-96 overflow-auto border-t border-gray-200 p-3 text-xs text-gray-600">{event.snapshotJson}</pre>
					</details>
				</div>
			</article>
		{/each}

		{#if data.auditEvents.length === 0}
			<div
				class="rounded-xl bg-white px-4 py-8 text-center text-sm text-gray-400 shadow-sm ring-1 ring-gray-200"
			>
				No RSVP audit events found.
			</div>
		{/if}
	</div>
</div>
