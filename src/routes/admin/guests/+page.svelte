<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { DIETARY_OPTIONS } from '$lib/types';

	let { data, form } = $props();
	let search = $state('');
	let statusFilter = $state('');
	let dietaryFilter = $state('');

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

	function getStatus(guest: typeof data.guests[0]): string {
		if (!guest.rsvps?.length) return 'No RSVP';
		const hasAttending = guest.rsvps.some((r: { attending: boolean | null }) => r.attending === true);
		const hasDeclined = guest.rsvps.some((r: { attending: boolean | null }) => r.attending === false);
		if (hasAttending) return 'Attending';
		if (hasDeclined) return 'Declined';
		return 'Pending';
	}

	function getStatusColor(status: string): string {
		if (status === 'Attending') return 'bg-green-100 text-green-700';
		if (status === 'Declined') return 'bg-red-100 text-red-700';
		return 'bg-yellow-100 text-yellow-700';
	}
</script>

<svelte:head>
	<title>Guests - Admin</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-semibold text-gray-900">Guests</h1>
		<a
			href="/admin/guests/new"
			class="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
		>
			Add Guest
		</a>
	</div>

	{#if form?.error}
		<div class="rounded-lg bg-red-50 p-3 text-sm text-red-700">{form.error}</div>
	{/if}

	<!-- Search and filters -->
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
			<option value="pending">Pending</option>
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

	<div class="rounded-xl bg-white shadow-sm ring-1 ring-gray-200 overflow-x-auto">
		<table class="w-full text-sm">
			<thead>
				<tr class="border-b border-gray-100">
					<th class="px-4 py-3 text-left font-medium text-gray-500">Name</th>
					<th class="px-4 py-3 text-left font-medium text-gray-500">Household</th>
					<th class="px-4 py-3 text-left font-medium text-gray-500">Email</th>
					<th class="px-4 py-3 text-left font-medium text-gray-500">Events</th>
					<th class="px-4 py-3 text-left font-medium text-gray-500">Status</th>
					<th class="px-4 py-3 text-right font-medium text-gray-500">Actions</th>
				</tr>
			</thead>
			<tbody>
				{#each data.guests as guest}
					{@const status = getStatus(guest)}
					<tr class="border-b border-gray-50">
						<td class="px-4 py-3">
							<a href="/admin/guests/{guest.id}" class="font-medium text-blue-600 hover:text-blue-800">
								{guest.first_name} {guest.last_name}
							</a>
							{#if guest.is_child}
								<span class="ml-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">Child</span>
							{/if}
						</td>
						<td class="px-4 py-3 text-gray-600">
							{#if guest.households}
								<a href="/admin/households/{guest.households.id}" class="hover:text-blue-600">{guest.households.name}</a>
							{:else}
								—
							{/if}
						</td>
						<td class="px-4 py-3 text-xs text-gray-600">
							{data.emailByGuestId[guest.id] || '—'}
						</td>
						<td class="px-4 py-3 text-gray-600">
							{#if guest.guest_events?.length}
								{guest.guest_events.map((ge: { events: { name: string } }) => ge.events?.name).filter(Boolean).join(', ')}
							{:else}
								<span class="text-gray-400">None</span>
							{/if}
						</td>
						<td class="px-4 py-3">
							<span class="rounded-full px-2 py-0.5 text-xs font-medium {getStatusColor(status)}">
								{status}
							</span>
						</td>
						<td class="px-4 py-3 text-right">
							<a href="/admin/guests/{guest.id}" class="mr-2 text-sm text-blue-600 hover:text-blue-800">Edit</a>
							<form method="POST" action="?/delete" use:enhance class="inline">
								<input type="hidden" name="id" value={guest.id} />
								<button
									type="submit"
									class="text-sm text-red-600 hover:text-red-800"
									onclick={(e) => { if (!confirm(`Delete ${guest.first_name} ${guest.last_name}?`)) e.preventDefault(); }}
								>Delete</button>
							</form>
						</td>
					</tr>
				{/each}
				{#if data.guests.length === 0}
					<tr>
						<td colspan="6" class="px-4 py-8 text-center text-gray-400">No guests found.</td>
					</tr>
				{/if}
			</tbody>
		</table>
	</div>
</div>
