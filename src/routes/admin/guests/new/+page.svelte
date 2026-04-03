<script lang="ts">
	import { enhance } from '$app/forms';
	import { addToast } from '$lib/toast.svelte';
	import HouseholdAutocomplete from '$lib/components/admin/HouseholdAutocomplete.svelte';

	let { data, form } = $props();
	let selectedHouseholdId = $state('');
	let firstName = $state('');
	let lastName = $state('');
	let isChild = $state(false);
</script>

<svelte:head>
	<title>Add Guest - Admin</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-center gap-3">
		<a href="/admin/guests" class="text-sm text-gray-500 hover:text-gray-700">&larr; Guests</a>
	</div>

	<h1 class="text-2xl font-semibold text-gray-900">Add Guest</h1>

	{#if form?.error}
		<div class="rounded-lg bg-red-50 p-3 text-sm text-red-700">{form.error}</div>
	{/if}

	<form
		method="POST"
		use:enhance={() => {
			return async ({ update, result }) => {
				await update({ reset: false });
				if (result.type === 'success') {
					addToast('Guest added successfully.');
					firstName = '';
					lastName = '';
					isChild = false;
				}
			};
		}}
		class="space-y-6"
	>
		<!-- Guest Details -->
		<div class="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
			<h2 class="mb-4 text-lg font-medium text-gray-900">Guest Details</h2>
			<div class="grid gap-4 sm:grid-cols-2">
				<label class="block">
					<span class="mb-1 block text-sm font-medium text-gray-700">First Name</span>
					<input
						type="text"
						name="first_name"
						bind:value={firstName}
						required
						class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
					/>
				</label>
				<label class="block">
					<span class="mb-1 block text-sm font-medium text-gray-700">Last Name</span>
					<input
						type="text"
						name="last_name"
						bind:value={lastName}
						required
						class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
					/>
				</label>
				<div class="block">
					<span class="mb-1 block text-sm font-medium text-gray-700">Household</span>
					<HouseholdAutocomplete
						households={data.households}
						bind:selectedId={selectedHouseholdId}
					/>
				</div>
				<label class="flex items-end gap-2 pb-2">
					<input
						type="checkbox"
						name="is_child"
						bind:checked={isChild}
						class="rounded border-gray-300"
					/>
					<span class="text-sm text-gray-700">Child</span>
				</label>
			</div>
		</div>

		<!-- Event Invitations -->
		<div class="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
			<h2 class="mb-4 text-lg font-medium text-gray-900">Event Invitations</h2>
			<div class="space-y-2">
				{#each data.events as event}
					<label class="flex items-center gap-2">
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
			</div>
		</div>

		<div class="flex justify-end">
			<button
				type="submit"
				class="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
			>
				Create Guest
			</button>
		</div>
	</form>
</div>
