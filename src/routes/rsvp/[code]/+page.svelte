<script lang="ts">
	import { enhance } from '$app/forms';
	import RsvpGuestForm from '$lib/components/RsvpGuestForm.svelte';
	import { COUPLE } from '$lib/config';
	import { guestSession } from '$lib/guest-session.svelte';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	$effect(() => {
		if (form?.success && data.household) {
			const guest = data.household.guests[0];
			guestSession.set({
				guest_id: guest.id,
				first_name: guest.first_name,
				last_name: guest.last_name,
				household_name: data.household.name,
				household_code: data.household.unique_code
			});
		}
	});
</script>

<svelte:head>
	<title>RSVP — {COUPLE.partner1} & {COUPLE.partner2}</title>
</svelte:head>

<section class="mx-auto max-w-2xl px-4 py-16">
	<div class="mb-10 text-center">
		<h1 class="font-script text-4xl text-brown sm:text-5xl">RSVP</h1>
		<div class="mx-auto mt-4 h-px w-16 bg-gold"></div>
		<p class="mt-4 font-serif text-xl text-brown-light">
			The {data.household.name}
		</p>
	</div>

	{#if form?.success}
		<div class="rounded-lg border border-burgundy bg-burgundy/10 p-8 text-center">
			<p class="font-script text-3xl text-burgundy-dark">Thank You!</p>
			<p class="mt-3 text-brown-light">
				Your RSVP has been submitted. You can update your response anytime by revisiting this page.
			</p>
		</div>
	{:else}
		{#if form?.success === false}
			<div class="mb-6 rounded-lg border border-burgundy-dark bg-burgundy-dark/10 p-4 text-center text-burgundy-dark">
				{form.message}
			</div>
		{/if}

		<form method="POST" use:enhance class="space-y-6">
			{#each data.household.guests as guest}
				<RsvpGuestForm
					{guest}
					existingRsvps={data.existingRsvps}
					existingContactInfo={data.existingContactInfo?.find((c) => c.guest_id === guest.id) ?? null}
				/>
			{/each}

			<div class="text-center">
				<button
					type="submit"
					class="inline-block rounded-full border-2 border-burgundy bg-burgundy px-10 py-3 text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-burgundy-dark hover:border-burgundy-dark focus:outline-none focus:ring-2 focus:ring-burgundy focus:ring-offset-2"
				>
					Submit RSVP
				</button>
			</div>
		</form>
	{/if}
</section>
