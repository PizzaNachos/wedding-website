<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();

	function getAttendingPill(guestId: string): { label: string; color: string } {
		const r = data.rsvpByGuestId[guestId];
		if (!r || r.attending === null) return { label: 'Pending', color: 'bg-yellow-100 text-yellow-700' };
		if (r.attending) return { label: 'Attending', color: 'bg-green-100 text-green-700' };
		return { label: 'Declined', color: 'bg-red-100 text-red-700' };
	}

	function getDietary(guestId: string): string {
		const r = data.rsvpByGuestId[guestId];
		if (!r?.dietary_restrictions) return '';
		const parts: string[] = [...(r.dietary_restrictions.selections ?? [])];
		if (r.dietary_restrictions.other) parts.push(r.dietary_restrictions.other);
		return parts.join(', ');
	}
</script>

<svelte:head>
	<title>{data.household.name} - Admin</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-center gap-3">
		<a href="/admin/households" class="text-sm text-gray-500 hover:text-gray-700">&larr; Households</a>
	</div>

	{#if form?.error}
		<div class="rounded-lg bg-red-50 p-3 text-sm text-red-700">{form.error}</div>
	{/if}

	<!-- Edit household -->
	<div class="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
		<h2 class="mb-4 text-lg font-medium text-gray-900">Edit Household</h2>
		<form method="POST" action="?/update" use:enhance>
			<div class="grid gap-4 sm:grid-cols-2">
				<label class="block">
					<span class="mb-1 block text-sm font-medium text-gray-700">Household Name</span>
					<input type="text" name="name" value={data.household.name} required class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
				</label>
				<label class="block">
					<span class="mb-1 block text-sm font-medium text-gray-700">Unique Code</span>
					<input type="text" name="unique_code" value={data.household.unique_code} required class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
				</label>
			</div>
			<div class="mt-4 flex justify-end">
				<button type="submit" class="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">
					Save Changes
				</button>
			</div>
		</form>
	</div>

	<!-- Guests in this household -->
	<div class="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
		<h2 class="mb-4 text-lg font-medium text-gray-900">Guests</h2>

		{#if data.household.guests?.length}
			<div class="mb-4 overflow-x-auto">
				<table class="w-full text-sm">
					<thead>
						<tr class="border-b border-gray-100">
							<th class="px-3 py-2 text-left font-medium text-gray-500">Name</th>
							<th class="px-3 py-2 text-left font-medium text-gray-500">Child</th>
							<th class="px-3 py-2 text-left font-medium text-gray-500">Attending</th>
							<th class="px-3 py-2 text-left font-medium text-gray-500">Events</th>
							<th class="px-3 py-2 text-left font-medium text-gray-500">Dietary</th>
							<th class="px-3 py-2 text-right font-medium text-gray-500">Actions</th>
						</tr>
					</thead>
					<tbody>
						{#each data.household.guests as guest}
							{@const attending = getAttendingPill(guest.id)}
							{@const guestEventNames = data.eventsByGuestId[guest.id] ?? []}
							{@const dietary = getDietary(guest.id)}
							<tr class="border-b border-gray-50">
								<td class="px-3 py-2">
									<a href="/admin/guests/{guest.id}" class="font-medium text-blue-600 hover:text-blue-800">
										{guest.first_name} {guest.last_name}
									</a>
								</td>
								<td class="px-3 py-2">
									{#if guest.is_child}
										<span class="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">Child</span>
									{/if}
									{#if guest.is_plus_one}
										<span class="rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-700">+1</span>
									{/if}
									{#if guest.allows_plus_one}
										<span class="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">+1 eligible</span>
									{/if}
								</td>
								<td class="px-3 py-2">
									<span class="rounded-full px-2 py-0.5 text-xs font-medium {attending.color}">
										{attending.label}
									</span>
								</td>
								<td class="px-3 py-2">
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
								<td class="px-3 py-2 text-xs text-gray-600">
									{dietary || '—'}
								</td>
								<td class="px-3 py-2 text-right">
									<form method="POST" action="?/removeGuest" use:enhance class="inline">
										<input type="hidden" name="guest_id" value={guest.id} />
										<button
											type="submit"
											class="text-sm text-red-600 hover:text-red-800"
											onclick={(e) => { if (!confirm(`Remove ${guest.first_name} ${guest.last_name}?`)) e.preventDefault(); }}
										>Remove</button>
									</form>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{:else}
			<p class="mb-4 text-sm text-gray-400">No guests in this household yet.</p>
		{/if}

		<!-- Add guest form -->
		<form method="POST" action="?/addGuest" use:enhance class="border-t border-gray-100 pt-4">
			<h3 class="mb-3 text-sm font-medium text-gray-700">Add Guest</h3>
			<div class="flex flex-wrap items-end gap-3">
				<label class="block">
					<span class="mb-1 block text-xs text-gray-500">First Name</span>
					<input type="text" name="first_name" required class="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
				</label>
				<label class="block">
					<span class="mb-1 block text-xs text-gray-500">Last Name</span>
					<input type="text" name="last_name" required class="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
				</label>
				<label class="flex items-center gap-2">
					<input type="checkbox" name="is_child" class="rounded border-gray-300" />
					<span class="text-sm text-gray-700">Child</span>
				</label>
				<label class="flex items-center gap-2">
					<input type="checkbox" name="allows_plus_one" class="rounded border-gray-300" />
					<span class="text-sm text-gray-700">Allows +1</span>
				</label>
			</div>
			<div class="mt-3 flex flex-wrap items-center gap-3">
				{#each data.events as event}
					<label class="flex items-center gap-1.5">
						<input
							type="checkbox"
							name="event_ids"
							value={event.id}
							checked={event.name === 'Reception'}
							class="rounded border-gray-300"
						/>
						<span class="text-sm text-gray-700">{event.name}</span>
					</label>
				{/each}
				<button type="submit" class="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">
					Add
				</button>
			</div>
		</form>
	</div>
</div>
