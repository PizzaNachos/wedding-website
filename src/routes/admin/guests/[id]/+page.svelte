<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();

	const assignedEventIds = $derived(
		new Set((data.guest.guest_events ?? []).map((ge: { event_id: string }) => ge.event_id))
	);

	function getRsvpForEvent(eventId: string) {
		return data.guest.rsvps?.find((r: { event_id: string }) => r.event_id === eventId);
	}
</script>

<svelte:head>
	<title>{data.guest.first_name} {data.guest.last_name} - Admin</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-center gap-3">
		<a href="/admin/guests" class="text-sm text-gray-500 hover:text-gray-700">&larr; Guests</a>
	</div>

	{#if form?.error}
		<div class="rounded-lg bg-red-50 p-3 text-sm text-red-700">{form.error}</div>
	{/if}
	{#if form?.success}
		<div class="rounded-lg bg-green-50 p-3 text-sm text-green-700">Guest updated successfully.</div>
	{/if}

	<form method="POST" action="?/update" use:enhance class="space-y-6">
		<!-- Guest details -->
		<div class="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
			<h2 class="mb-4 text-lg font-medium text-gray-900">Guest Details</h2>
			<div class="grid gap-4 sm:grid-cols-2">
				<label class="block">
					<span class="mb-1 block text-sm font-medium text-gray-700">First Name</span>
					<input type="text" name="first_name" value={data.guest.first_name} required class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
				</label>
				<label class="block">
					<span class="mb-1 block text-sm font-medium text-gray-700">Last Name</span>
					<input type="text" name="last_name" value={data.guest.last_name} required class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
				</label>
				<label class="block">
					<span class="mb-1 block text-sm font-medium text-gray-700">Household</span>
					<select name="household_id" required class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
						{#each data.households as h}
							<option value={h.id} selected={h.id === data.guest.household_id}>{h.name}</option>
						{/each}
					</select>
				</label>
				<label class="flex items-end gap-2 pb-2">
					<input type="checkbox" name="is_child" class="rounded border-gray-300" checked={data.guest.is_child} />
					<span class="text-sm text-gray-700">Child</span>
				</label>
			</div>
		</div>

		<!-- Event assignments -->
		<div class="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
			<h2 class="mb-4 text-lg font-medium text-gray-900">Event Invitations</h2>
			<div class="space-y-3">
				{#each data.events as event}
					{@const rsvp = getRsvpForEvent(event.id)}
					<label class="flex items-center justify-between rounded-lg border border-gray-200 p-3">
						<div class="flex items-center gap-3">
							<input
								type="checkbox"
								name="event_ids"
								value={event.id}
								checked={assignedEventIds.has(event.id)}
								class="rounded border-gray-300"
							/>
							<span class="text-sm font-medium text-gray-900">{event.name}</span>
						</div>
						{#if rsvp}
							<span class="rounded-full px-2 py-0.5 text-xs font-medium {rsvp.attending === true ? 'bg-green-100 text-green-700' : rsvp.attending === false ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}">
								{rsvp.attending === true ? 'Attending' : rsvp.attending === false ? 'Declined' : 'Pending'}
							</span>
						{/if}
					</label>
				{/each}
			</div>
		</div>

		<!-- Contact information (read-only) -->
	{#if data.contactInfo}
		<div class="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
			<h2 class="mb-4 text-lg font-medium text-gray-900">Contact Information</h2>
			<div class="grid gap-3 sm:grid-cols-2">
				<div>
					<p class="text-xs font-medium text-gray-500">Email</p>
					<p class="text-sm text-gray-900">{data.contactInfo.email}</p>
				</div>
				{#if data.contactInfo.phone}
					<div>
						<p class="text-xs font-medium text-gray-500">Phone</p>
						<p class="text-sm text-gray-900">{data.contactInfo.phone}</p>
					</div>
				{/if}
				{#if data.contactInfo.address_street || data.contactInfo.address_city}
					<div class="sm:col-span-2">
						<p class="text-xs font-medium text-gray-500">Mailing Address</p>
						<p class="text-sm text-gray-900">
							{[
								data.contactInfo.address_street,
								data.contactInfo.address_unit,
								data.contactInfo.address_city,
								data.contactInfo.address_state && data.contactInfo.address_zip
									? `${data.contactInfo.address_state} ${data.contactInfo.address_zip}`
									: data.contactInfo.address_state || data.contactInfo.address_zip
							].filter(Boolean).join(', ')}
						</p>
					</div>
				{/if}
			</div>
		</div>
	{:else if !data.guest.is_child}
		<div class="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
			<h2 class="mb-4 text-lg font-medium text-gray-900">Contact Information</h2>
			<p class="text-sm text-gray-400">No contact information submitted.</p>
		</div>
	{/if}

	<!-- RSVP summary (read-only) -->
		{#if data.guest.rsvps?.length}
			<div class="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
				<h2 class="mb-4 text-lg font-medium text-gray-900">RSVP Info</h2>
				{#each data.guest.rsvps as rsvp}
					{@const event = data.events.find((e: { id: string }) => e.id === rsvp.event_id)}
					<div class="mb-3 rounded-lg border border-gray-100 p-3">
						<p class="text-sm font-medium text-gray-700">{event?.name ?? 'Unknown Event'}</p>
						<p class="text-sm text-gray-500">
							Status: {rsvp.attending === true ? 'Attending' : rsvp.attending === false ? 'Declined' : 'Pending'}
						</p>
						{#if rsvp.dietary_restrictions?.selections?.length}
							<p class="text-sm text-gray-500">Dietary: {rsvp.dietary_restrictions.selections.join(', ')}</p>
						{/if}
						{#if rsvp.dietary_restrictions?.other}
							<p class="text-sm text-gray-500">Other: {rsvp.dietary_restrictions.other}</p>
						{/if}
						{#if rsvp.song_request}
							<p class="text-sm text-gray-500">Song: {rsvp.song_request}</p>
						{/if}
					</div>
				{/each}
			</div>
		{/if}

		<div class="flex justify-end">
			<button type="submit" class="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">
				Save Changes
			</button>
		</div>
	</form>
</div>
