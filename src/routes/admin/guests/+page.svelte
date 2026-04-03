<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto, invalidateAll } from '$app/navigation';
	import { DIETARY_OPTIONS } from '$lib/types';

	let { data, form } = $props();
	let search = $state('');
	let statusFilter = $state('');
	let dietaryFilter = $state('');

	// Import state
	let importFile = $state<File | null>(null);
	let importing = $state(false);
	let importResult = $state<{
		imported: { households: number; guests: number };
		skipped: { household: string; reason: string }[];
		errors: { row: number; reason: string }[];
	} | null>(null);
	let importError = $state('');

	$effect(() => {
		search = data.search;
		statusFilter = data.statusFilter;
		dietaryFilter = data.dietaryFilter;
	});

	function applyFilters() {
		const params = new URLSearchParams();
		if (search) params.set('search', search);
		if (statusFilter) params.set('status', statusFilter);
		if (dietaryFilter) params.set('dietary', dietaryFilter);
		goto(`/admin/guests?${params.toString()}`, { invalidateAll: true });
	}

	function getStatus(guest: (typeof data.guests)[0]): string {
		if (!guest.rsvps?.length) return 'No RSVP';
		const hasAttending = guest.rsvps.some(
			(r: { attending: boolean | null }) => r.attending === true
		);
		const hasDeclined = guest.rsvps.some(
			(r: { attending: boolean | null }) => r.attending === false
		);
		if (hasAttending) return 'Attending';
		if (hasDeclined) return 'Declined';
		return 'Pending';
	}

	function getStatusColor(status: string): string {
		if (status === 'Attending') return 'bg-green-100 text-green-700';
		if (status === 'Declined') return 'bg-red-100 text-red-700';
		return 'bg-yellow-100 text-yellow-700';
	}

	function getDietary(guest: (typeof data.guests)[0]): string {
		console.log('Giest diet,', guest);
		const rsvp = guest.rsvps;
		if (!rsvp?.dietary_restrictions) return '';
		const parts: string[] = [...(rsvp.dietary_restrictions.selections ?? [])];
		if (rsvp.dietary_restrictions.other) parts.push(rsvp.dietary_restrictions.other);
		return parts.join(', ');
	}

	async function handleImport() {
		if (!importFile) return;
		importing = true;
		importResult = null;
		importError = '';

		const fd = new FormData();
		fd.append('file', importFile);

		try {
			const res = await fetch('/admin/guests/import', { method: 'POST', body: fd });
			const json = await res.json();
			if (!res.ok) {
				importError = json.error ?? 'Import failed.';
			} else {
				importResult = json;
				await invalidateAll();
			}
		} catch {
			importError = 'Network error during import.';
		} finally {
			importing = false;
			importFile = null;
		}
	}
</script>

<svelte:head>
	<title>Guests - Admin</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-semibold text-gray-900">Guests</h1>
		<div class="flex items-center gap-2">
			<a
				href="/admin/guests/import/template"
				class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
			>
				Download Template
			</a>
			<label
				class="cursor-pointer rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
			>
				{importing ? 'Importing…' : 'Import CSV'}
				<input
					type="file"
					accept=".csv"
					class="hidden"
					disabled={importing}
					onchange={(e) => {
						const input = e.currentTarget as HTMLInputElement;
						importFile = input.files?.[0] ?? null;
						input.value = '';
						if (importFile) handleImport();
					}}
				/>
			</label>
			<a
				href="/admin/guests/new"
				class="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
			>
				Add Guest
			</a>
		</div>
	</div>

	{#if form?.error}
		<div class="rounded-lg bg-red-50 p-3 text-sm text-red-700">{form.error}</div>
	{/if}

	{#if importError}
		<div class="rounded-lg bg-red-50 p-3 text-sm text-red-700">{importError}</div>
	{/if}

	{#if importResult}
		<div class="space-y-2 rounded-lg border border-gray-200 bg-white p-4 text-sm">
			<p class="font-medium text-gray-900">
				Import complete: {importResult.imported.households} household{importResult.imported
					.households !== 1
					? 's'
					: ''} and {importResult.imported.guests} guest{importResult.imported.guests !== 1
					? 's'
					: ''} added.
			</p>
			{#if importResult.skipped.length > 0}
				<div>
					<p class="font-medium text-yellow-700">Skipped ({importResult.skipped.length}):</p>
					<ul class="ml-4 list-disc text-yellow-700">
						{#each importResult.skipped as s}
							<li>{s.household} — {s.reason}</li>
						{/each}
					</ul>
				</div>
			{/if}
			{#if importResult.errors.length > 0}
				<div>
					<p class="font-medium text-red-700">Row errors ({importResult.errors.length}):</p>
					<ul class="ml-4 list-disc text-red-700">
						{#each importResult.errors as e}
							<li>Row {e.row} — {e.reason}</li>
						{/each}
					</ul>
				</div>
			{/if}
		</div>
	{/if}

	<!-- Search and filters -->
	<div class="flex flex-wrap gap-3">
		<input
			type="text"
			placeholder="Search by name..."
			bind:value={search}
			onkeydown={(e) => {
				if (e.key === 'Enter') applyFilters();
			}}
			class="rounded-lg border border-gray-300 px-3 py-2 text-sm"
		/>
		<select
			bind:value={statusFilter}
			onchange={applyFilters}
			class="rounded-lg border border-gray-300 px-3 py-2 text-sm"
		>
			<option value="">All Statuses</option>
			<option value="attending">Attending</option>
			<option value="declined">Declined</option>
			<option value="pending">Pending</option>
		</select>
		<select
			bind:value={dietaryFilter}
			onchange={applyFilters}
			class="rounded-lg border border-gray-300 px-3 py-2 text-sm"
		>
			<option value="">All Dietary</option>
			{#each DIETARY_OPTIONS as opt}
				<option value={opt}>{opt}</option>
			{/each}
		</select>
		<button
			onclick={applyFilters}
			class="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
		>
			Search
		</button>
	</div>

	<div class="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
		<table class="w-full text-sm">
			<thead>
				<tr class="border-b border-gray-100">
					<th class="px-4 py-3 text-left font-medium text-gray-500">Name</th>
					<th class="px-4 py-3 text-left font-medium text-gray-500">Household</th>
					<th class="px-4 py-3 text-left font-medium text-gray-500">Email</th>
					<th class="px-4 py-3 text-left font-medium text-gray-500">Status</th>
					<th class="px-4 py-3 text-left font-medium text-gray-500">Events</th>
					<th class="px-4 py-3 text-left font-medium text-gray-500">Dietary</th>
					<th class="px-4 py-3 text-right font-medium text-gray-500">Actions</th>
				</tr>
			</thead>
			<tbody>
				{#each data.guests as guest}
					{@const status = getStatus(guest)}
					{@const guestEventNames = data.eventsByGuestId[guest.id] ?? []}
					{@const dietary = getDietary(guest)}
					<tr class="border-b border-gray-50">
						<td class="px-4 py-3">
							<a
								href="/admin/guests/{guest.id}"
								class="font-medium text-blue-600 hover:text-blue-800"
							>
								{guest.first_name}
								{guest.last_name}
							</a>
							{#if guest.is_child}
								<span class="ml-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700"
									>Child</span
								>
							{/if}
						</td>
						<td class="px-4 py-3 text-gray-600">
							{#if guest.households}
								<a href="/admin/households/{guest.households.id}" class="hover:text-blue-600"
									>{guest.households.name}</a
								>
							{:else}
								—
							{/if}
						</td>
						<td class="px-4 py-3 text-xs text-gray-600">
							{data.emailByHouseholdId[guest.household_id] || '—'}
						</td>
						<td class="px-4 py-3">
							<span class="rounded-full px-2 py-0.5 text-xs font-medium {getStatusColor(status)}">
								{status}
							</span>
						</td>
						<td class="px-4 py-3">
							{#if guestEventNames.length > 0}
								<div class="flex flex-wrap gap-1">
									{#each guestEventNames as eventName}
										<span class="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
											{eventName}
										</span>
									{/each}
								</div>
							{:else}
								<span class="text-xs text-gray-400">—</span>
							{/if}
						</td>
						<td class="px-4 py-3 text-xs text-gray-600">
							{dietary || '—'}
						</td>
						<td class="px-4 py-3 text-right">
							<a
								href="/admin/guests/{guest.id}"
								class="mr-2 text-sm text-blue-600 hover:text-blue-800">Edit</a
							>
							<form method="POST" action="?/delete" use:enhance class="inline">
								<input type="hidden" name="id" value={guest.id} />
								<button
									type="submit"
									class="text-sm text-red-600 hover:text-red-800"
									onclick={(e) => {
										if (!confirm(`Delete ${guest.first_name} ${guest.last_name}?`))
											e.preventDefault();
									}}>Delete</button
								>
							</form>
						</td>
					</tr>
				{/each}
				{#if data.guests.length === 0}
					<tr>
						<td colspan="7" class="px-4 py-8 text-center text-gray-400">No guests found.</td>
					</tr>
				{/if}
			</tbody>
		</table>
	</div>
</div>
