<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();
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
			<div class="mb-4 divide-y divide-gray-100">
				{#each data.household.guests as guest}
					<div class="flex items-center justify-between py-3">
						<div>
							<a href="/admin/guests/{guest.id}" class="font-medium text-blue-600 hover:text-blue-800">
								{guest.first_name} {guest.last_name}
							</a>
							{#if guest.is_child}
								<span class="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">Child</span>
							{/if}
							{#if guest.guest_events?.length}
								<span class="ml-2 text-xs text-gray-400">
									{guest.guest_events.length} event{guest.guest_events.length !== 1 ? 's' : ''}
								</span>
							{/if}
						</div>
						<form method="POST" action="?/removeGuest" use:enhance>
							<input type="hidden" name="guest_id" value={guest.id} />
							<button
								type="submit"
								class="text-sm text-red-600 hover:text-red-800"
								onclick={(e) => { if (!confirm(`Remove ${guest.first_name} ${guest.last_name}?`)) e.preventDefault(); }}
							>Remove</button>
						</form>
					</div>
				{/each}
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
				<button type="submit" class="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">
					Add
				</button>
			</div>
		</form>
	</div>
</div>
