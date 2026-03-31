<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();
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

		<!-- Contact information (read-only, household level) -->
		{#if data.contactInfo}
			<div class="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
				<h2 class="mb-4 text-lg font-medium text-gray-900">Household Contact Information</h2>
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
									data.contactInfo.address_city,
									data.contactInfo.address_state,
									data.contactInfo.address_country,
									data.contactInfo.address_postal_code
								].filter(Boolean).join(', ')}
							</p>
						</div>
					{/if}
				</div>
			</div>
		{:else}
			<div class="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
				<h2 class="mb-4 text-lg font-medium text-gray-900">Household Contact Information</h2>
				<p class="text-sm text-gray-400">No contact information submitted.</p>
			</div>
		{/if}

		<!-- RSVP summary (read-only) -->
		{#if data.guest.rsvps?.length}
			{@const rsvp = data.guest.rsvps[0]}
			<div class="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
				<h2 class="mb-4 text-lg font-medium text-gray-900">RSVP Info</h2>
				<div class="rounded-lg border border-gray-100 p-3">
					<p class="text-sm text-gray-500">
						Reception: {rsvp.attending === true ? 'Attending' : rsvp.attending === false ? 'Declined' : 'Pending'}
					</p>
					{#if data.ceremonyInterest}
						<p class="text-sm text-gray-500">
							Ceremony Interest: {data.ceremonyInterest.interest_level}
							{#if data.ceremonyInterest.other_text}
								— {data.ceremonyInterest.other_text}
							{/if}
						</p>
					{/if}
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
			</div>
		{/if}

		<div class="flex justify-end">
			<button type="submit" class="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">
				Save Changes
			</button>
		</div>
	</form>
</div>
