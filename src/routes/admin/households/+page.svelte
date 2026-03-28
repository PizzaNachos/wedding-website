<script lang="ts">
	import { enhance } from '$app/forms';
	import { addToast } from '$lib/toast.svelte';

	let { data, form } = $props();
	let showCreate = $state(false);
	let formEl: HTMLFormElement;
</script>

<svelte:head>
	<title>Households - Admin</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-semibold text-gray-900">Households</h1>
		<button
			onclick={() => (showCreate = !showCreate)}
			class="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
		>
			{showCreate ? 'Cancel' : 'Add Household'}
		</button>
	</div>

	{#if form?.error}
		<div class="rounded-lg bg-red-50 p-3 text-sm text-red-700">{form.error}</div>
	{/if}

	{#if showCreate}
		<form
			bind:this={formEl}
			method="POST"
			action="?/create"
			use:enhance={() => {
				return async ({ update, result }) => {
					await update();
					if (result.type === 'success') {
						addToast('Household created successfully.');
						formEl.reset();
					}
				};
			}}
			class="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200"
		>
			<h2 class="mb-4 text-lg font-medium text-gray-900">New Household</h2>
			<div class="grid gap-4 sm:grid-cols-2">
				<label class="block">
					<span class="mb-1 block text-sm font-medium text-gray-700">Household Name</span>
					<input type="text" name="name" required class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="The Smith Family" />
				</label>
				<label class="block">
					<span class="mb-1 block text-sm font-medium text-gray-700">Unique Code</span>
					<input type="text" name="unique_code" required class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="smith-family" />
				</label>
			</div>
			<div class="mt-4 flex justify-end">
				<button type="submit" class="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">
					Create Household
				</button>
			</div>
		</form>
	{/if}

	<div class="rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
		<table class="w-full text-sm">
			<thead>
				<tr class="border-b border-gray-100">
					<th class="px-4 py-3 text-left font-medium text-gray-500">Name</th>
					<th class="px-4 py-3 text-left font-medium text-gray-500">Code</th>
					<th class="px-4 py-3 text-left font-medium text-gray-500">Guests</th>
					<th class="px-4 py-3 text-right font-medium text-gray-500">Actions</th>
				</tr>
			</thead>
			<tbody>
				{#each data.households as household}
					<tr class="border-b border-gray-50">
						<td class="px-4 py-3">
							<a href="/admin/households/{household.id}" class="font-medium text-blue-600 hover:text-blue-800">
								{household.name}
							</a>
						</td>
						<td class="px-4 py-3 font-mono text-xs text-gray-500">{household.unique_code}</td>
						<td class="px-4 py-3 text-gray-600">
							{household.guests?.length ?? 0}
							{#if household.guests?.length}
								<span class="text-xs text-gray-400">
									({household.guests.map((g: { first_name: string }) => g.first_name).join(', ')})
								</span>
							{/if}
						</td>
						<td class="px-4 py-3 text-right">
							<form method="POST" action="?/inviteAll" use:enhance class="mr-2 inline">
								<input type="hidden" name="household_id" value={household.id} />
								<button type="submit" class="text-sm text-green-600 hover:text-green-800" title="Invite all guests to all events">
									Invite All
								</button>
							</form>
							<a href="/admin/households/{household.id}" class="mr-2 text-sm text-blue-600 hover:text-blue-800">Edit</a>
							<form method="POST" action="?/delete" use:enhance class="inline">
								<input type="hidden" name="id" value={household.id} />
								<button
									type="submit"
									class="text-sm text-red-600 hover:text-red-800"
									onclick={(e) => { if (!confirm('Delete this household and all its guests?')) e.preventDefault(); }}
								>Delete</button>
							</form>
						</td>
					</tr>
				{/each}
				{#if data.households.length === 0}
					<tr>
						<td colspan="4" class="px-4 py-8 text-center text-gray-400">No households yet.</td>
					</tr>
				{/if}
			</tbody>
		</table>
	</div>
</div>
