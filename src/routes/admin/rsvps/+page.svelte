<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { DIETARY_OPTIONS } from '$lib/types';

	let { data, form } = $props();
	let search = $state('');
	let statusFilter = $state('');
	let dietaryFilter = $state('');
	let editingKey = $state<string | null>(null);

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
		goto(`/admin/rsvps?${params.toString()}`, { invalidateAll: true });
	}

	function formatDate(dateStr: string | null): string {
		if (!dateStr) return '—';
		return new Date(dateStr).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		});
	}

	function attendancePill(attending: boolean | null, invited: boolean): { label: string; classes: string } {
		if (!invited) return { label: '—', classes: '' };
		if (attending === true) return { label: 'Yes', classes: 'bg-green-100 text-green-700' };
		if (attending === false) return { label: 'No', classes: 'bg-red-100 text-red-700' };
		return { label: '?', classes: 'bg-yellow-100 text-yellow-700' };
	}

	// Find reception event for dietary association
	const receptionEvent = $derived(data.events.find((e: { name: string }) => e.name === 'Reception'));
</script>

<svelte:head>
	<title>RSVPs - Admin</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-semibold text-gray-900">RSVPs</h1>
		<a
			href="/admin/rsvps/export"
			class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
		>
			Export CSV
		</a>
	</div>

	{#if form?.error}
		<div class="rounded-lg bg-red-50 p-3 text-sm text-red-700">{form.error}</div>
	{/if}

	<!-- Filters -->
	<div class="flex flex-wrap gap-3">
		<input
			type="text"
			placeholder="Search by name..."
			bind:value={search}
			onkeydown={(e) => { if (e.key === 'Enter') applyFilters(); }}
			class="rounded-lg border border-gray-300 px-3 py-2 text-sm"
		/>
		<select bind:value={statusFilter} onchange={applyFilters} class="rounded-lg border border-gray-300 px-3 py-2 text-sm">
			<option value="">All Statuses</option>
			<option value="attending">Attending</option>
			<option value="declined">Declined</option>
			<option value="pending">Not Responded</option>
		</select>
		<select bind:value={dietaryFilter} onchange={applyFilters} class="rounded-lg border border-gray-300 px-3 py-2 text-sm">
			<option value="">All Dietary</option>
			{#each DIETARY_OPTIONS as opt}
				<option value={opt}>{opt}</option>
			{/each}
		</select>
		<button onclick={applyFilters} class="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
			Search
		</button>
	</div>

	<p class="text-sm text-gray-500">{data.rows.length} result{data.rows.length !== 1 ? 's' : ''}</p>

	<div class="rounded-xl bg-white shadow-sm ring-1 ring-gray-200 overflow-x-auto">
		<table class="w-full text-sm">
			<thead>
				<tr class="border-b border-gray-100">
					<th class="px-4 py-3 text-left font-medium text-gray-500">Guest</th>
					<th class="px-4 py-3 text-left font-medium text-gray-500">Household</th>
					{#each data.events as event}
						<th class="px-4 py-3 text-left font-medium text-gray-500">{event.name}</th>
					{/each}
					<th class="px-4 py-3 text-left font-medium text-gray-500">Dietary</th>
					<th class="px-4 py-3 text-left font-medium text-gray-500">Email</th>
					<th class="px-4 py-3 text-left font-medium text-gray-500">Phone</th>
					<th class="px-4 py-3 text-left font-medium text-gray-500">Address</th>
					<th class="px-4 py-3 text-left font-medium text-gray-500">Submitted</th>
					<th class="px-4 py-3 text-right font-medium text-gray-500">Actions</th>
				</tr>
			</thead>
			<tbody>
				{#each data.rows as row}
					{#if editingKey === row.guestId}
						<tr class="border-b border-gray-50">
							<td colspan={data.events.length + 8} class="p-4">
								<form
									method="POST"
									action="?/update"
									use:enhance={() => {
										return async ({ update, result }) => {
											await update();
											if (result.type === 'success') editingKey = null;
										};
									}}
								>
									<input type="hidden" name="guest_id" value={row.guestId} />
									{#if receptionEvent}
										<input type="hidden" name="reception_event_id" value={receptionEvent.id} />
									{/if}
									<div class="mb-3 text-sm font-medium text-gray-900">
										{row.guestName}
									</div>
									<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
										{#each data.events as event}
											{#if row.eventInvited[event.id]}
												<label class="block">
													<span class="mb-1 block text-xs text-gray-500">{event.name}</span>
													<select name="events[{event.id}].attending" class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
														<option value="" selected={row.eventAttendance[event.id] === null}>Not responded</option>
														<option value="yes" selected={row.eventAttendance[event.id] === true}>Attending</option>
														<option value="no" selected={row.eventAttendance[event.id] === false}>Declined</option>
													</select>
												</label>
											{/if}
										{/each}
										<div>
											<span class="mb-1 block text-xs text-gray-500">Dietary Restrictions</span>
											<div class="flex flex-wrap gap-2">
												{#each DIETARY_OPTIONS as opt}
													<label class="flex items-center gap-1 text-xs">
														<input
															type="checkbox"
															name="dietary_selections"
															value={opt}
															checked={row.dietaryRestrictions?.selections?.includes(opt)}
															class="rounded border-gray-300"
														/>
														{opt}
													</label>
												{/each}
											</div>
											<input
												type="text"
												name="dietary_other"
												value={row.dietaryRestrictions?.other ?? ''}
												placeholder="Other..."
												class="mt-2 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-xs"
											/>
										</div>
									</div>
									<div class="mt-3 flex gap-2">
										<button type="submit" class="rounded-lg bg-gray-900 px-3 py-1.5 text-sm text-white hover:bg-gray-800">Save</button>
										<button type="button" onclick={() => (editingKey = null)} class="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
									</div>
								</form>
							</td>
						</tr>
					{:else}
						<tr class="border-b border-gray-50">
							<td class="px-4 py-3 font-medium text-gray-900">
								{row.guestName}
								{#if row.isPlusOne}
									<span class="ml-1 rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-700">+1</span>
								{/if}
							</td>
							<td class="px-4 py-3 text-gray-600">{row.householdName}</td>
							{#each data.events as event}
								{@const pill = attendancePill(row.eventAttendance[event.id], row.eventInvited[event.id])}
								<td class="px-4 py-3">
									{#if pill.classes}
										<span class="rounded-full px-2 py-0.5 text-xs font-medium {pill.classes}">{pill.label}</span>
									{:else}
										<span class="text-xs text-gray-400">{pill.label}</span>
									{/if}
								</td>
							{/each}
							<td class="px-4 py-3 text-xs text-gray-600">
								{#if row.dietaryRestrictions?.selections?.length}
									{row.dietaryRestrictions.selections.join(', ')}
								{:else}
									—
								{/if}
							</td>
							<td class="px-4 py-3 text-xs text-gray-600">{row.email || '—'}</td>
							<td class="px-4 py-3 text-xs text-gray-600">{row.phone || '—'}</td>
							<td class="px-4 py-3 text-xs text-gray-600 max-w-48 truncate" title={row.address || ''}>{row.address || '—'}</td>
							<td class="px-4 py-3 text-xs text-gray-400">{formatDate(row.submittedAt)}</td>
							<td class="px-4 py-3 text-right">
								<button onclick={() => (editingKey = row.guestId)} class="text-sm text-blue-600 hover:text-blue-800">Edit</button>
							</td>
						</tr>
					{/if}
				{/each}
				{#if data.rows.length === 0}
					<tr>
						<td colspan={data.events.length + 8} class="px-4 py-8 text-center text-gray-400">No RSVPs found.</td>
					</tr>
				{/if}
			</tbody>
		</table>
	</div>
</div>
