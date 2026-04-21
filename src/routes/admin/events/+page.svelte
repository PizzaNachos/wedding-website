<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();
	let showCreate = $state(false);
	let editingId = $state<string | null>(null);
</script>

<svelte:head>
	<title>Events - Admin</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-semibold text-gray-900">Events</h1>
		<button
			onclick={() => (showCreate = !showCreate)}
			class="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
		>
			{showCreate ? 'Cancel' : 'Add Event'}
		</button>
	</div>

	{#if form?.error}
		<div class="rounded-lg bg-red-50 p-3 text-sm text-red-700">{form.error}</div>
	{/if}

	<!-- Create form -->
	{#if showCreate}
		<form
			method="POST"
			action="?/create"
			use:enhance={() => {
				return async ({ update, result }) => {
					await update();
					if (result.type === 'success') showCreate = false;
				};
			}}
			class="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200"
		>
			<h2 class="mb-4 text-lg font-medium text-gray-900">New Event</h2>
			<div class="grid gap-4 sm:grid-cols-2">
				<label class="block">
					<span class="mb-1 block text-sm font-medium text-gray-700">Name</span>
					<input type="text" name="name" required class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
				</label>
				<label class="block">
					<span class="mb-1 block text-sm font-medium text-gray-700">Date</span>
					<input type="date" name="date" required class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
				</label>
				<label class="block">
					<span class="mb-1 block text-sm font-medium text-gray-700">Time</span>
					<input type="time" name="time" required class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
				</label>
				<label class="block">
					<span class="mb-1 block text-sm font-medium text-gray-700">Location</span>
					<input type="text" name="location" class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
				</label>
				<label class="block sm:col-span-2">
					<span class="mb-1 block text-sm font-medium text-gray-700">Description</span>
					<textarea name="description" rows="2" class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"></textarea>
				</label>
				<label class="block sm:col-span-2">
					<span class="mb-1 block text-sm font-medium text-gray-700">Description (Spanish)</span>
					<textarea name="description_es" rows="2" class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"></textarea>
				</label>
				<label class="block">
					<span class="mb-1 block text-sm font-medium text-gray-700">Address</span>
					<input type="text" name="address" class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
				</label>
				<label class="block">
					<span class="mb-1 block text-sm font-medium text-gray-700">Image Path</span>
					<input type="text" name="image_path" placeholder="/images/rsvp/photo.jpg" class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
				</label>
				<label class="block">
					<span class="mb-1 block text-sm font-medium text-gray-700">Sort Order</span>
					<input type="number" name="sort_order" value="0" class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
				</label>
			</div>
			<div class="mt-4 flex justify-end">
				<button type="submit" class="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">
					Create Event
				</button>
			</div>
		</form>
	{/if}

	<!-- Events list -->
	<div class="rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
		<table class="w-full text-sm">
			<thead>
				<tr class="border-b border-gray-100">
					<th class="px-4 py-3 text-left font-medium text-gray-500">Name</th>
					<th class="px-4 py-3 text-left font-medium text-gray-500">Date</th>
					<th class="px-4 py-3 text-left font-medium text-gray-500">Time</th>
					<th class="px-4 py-3 text-left font-medium text-gray-500">Location</th>
					<th class="px-4 py-3 text-right font-medium text-gray-500">Invited</th>
					<th class="px-4 py-3 text-right font-medium text-gray-500">Actions</th>
				</tr>
			</thead>
			<tbody>
				{#each data.events as event}
					{#if editingId === event.id}
						<tr class="border-b border-gray-50">
							<td colspan="6" class="p-4">
								<form
									method="POST"
									action="?/update"
									use:enhance={() => {
										return async ({ update, result }) => {
											await update();
											if (result.type === 'success') editingId = null;
										};
									}}
								>
									<input type="hidden" name="id" value={event.id} />
									<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
										<input type="text" name="name" value={event.name} required class="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
										<input type="date" name="date" value={event.date} required class="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
										<input type="time" name="time" value={event.time?.slice(0, 5)} required class="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
										<input type="text" name="location" value={event.location ?? ''} class="rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="Location" />
									</div>
									<textarea name="description" rows="2" class="mt-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="Description">{event.description ?? ''}</textarea>
								<textarea name="description_es" rows="2" class="mt-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="Description (Spanish)">{event.description_es ?? ''}</textarea>
									<div class="mt-3 grid gap-3 sm:grid-cols-3">
										<input type="text" name="address" value={event.address ?? ''} class="rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="Address" />
										<input type="text" name="image_path" value={event.image_path ?? ''} class="rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="Image path" />
										<input type="number" name="sort_order" value={event.sort_order ?? 0} class="rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="Sort order" />
									</div>
									<div class="mt-3 flex gap-2">
										<button type="submit" class="rounded-lg bg-gray-900 px-3 py-1.5 text-sm text-white hover:bg-gray-800">Save</button>
										<button type="button" onclick={() => (editingId = null)} class="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
									</div>
								</form>
							</td>
						</tr>
					{:else}
						<tr class="border-b border-gray-50">
							<td class="px-4 py-3 font-medium text-gray-900">{event.name}</td>
							<td class="px-4 py-3 text-gray-600">{event.date}</td>
							<td class="px-4 py-3 text-gray-600">{event.time?.slice(0, 5)}</td>
							<td class="px-4 py-3 text-gray-600">{event.location ?? '—'}</td>
							<td class="px-4 py-3 text-right text-gray-600">{event.guest_events?.[0]?.count ?? 0}</td>
							<td class="px-4 py-3 text-right">
								<button onclick={() => (editingId = event.id)} class="mr-2 text-sm text-blue-600 hover:text-blue-800">Edit</button>
								<form method="POST" action="?/delete" use:enhance class="inline">
									<input type="hidden" name="id" value={event.id} />
									<button
										type="submit"
										class="text-sm text-red-600 hover:text-red-800"
										onclick={(e) => { if (!confirm('Delete this event? This will also remove all guest assignments and RSVPs for it.')) e.preventDefault(); }}
									>Delete</button>
								</form>
							</td>
						</tr>
					{/if}
				{/each}
				{#if data.events.length === 0}
					<tr>
						<td colspan="6" class="px-4 py-8 text-center text-gray-400">No events yet.</td>
					</tr>
				{/if}
			</tbody>
		</table>
	</div>
</div>
