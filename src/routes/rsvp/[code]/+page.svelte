<script lang="ts">
	import { enhance } from '$app/forms';
	import RsvpGuestForm from '$lib/components/RsvpGuestForm.svelte';
	import { COUPLE } from '$lib/config';
	import { i18n } from '$lib/i18n.svelte';
	import { guestSession } from '$lib/guest-session.svelte';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const hasAdults = data.household.guests.some((g: { is_child: boolean }) => !g.is_child);
	const hasExistingRsvp = data.existingRsvps.length > 0;

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
	<title>{i18n.t.rsvpCode.title} — {COUPLE.partner1} & {COUPLE.partner2}</title>
</svelte:head>

<section class="mx-auto max-w-2xl px-4 py-16">
	<div class="mb-10 text-center">
		<h1 class="font-script text-4xl text-brown sm:text-5xl">{i18n.t.rsvpCode.title}</h1>
		<div class="mx-auto mt-4 h-px w-16 bg-gold"></div>
		<p class="mt-4 font-serif text-xl text-brown-light">
			The {data.household.name}
		</p>
	</div>

	{#if form?.success}
		<div class="rounded-lg border border-burgundy bg-burgundy/10 p-8 text-center">
			<p class="font-script text-3xl text-burgundy-dark">{i18n.t.rsvpCode.thankYou}</p>
			<p class="mt-3 text-brown-light">
				{i18n.t.rsvpCode.submitted}
			</p>
		</div>
	{:else}
		{#if form?.success === false}
			<div class="mb-6 rounded-lg border border-burgundy-dark bg-burgundy-dark/10 p-4 text-center text-burgundy-dark">
				{form.message}
			</div>
		{/if}

		<form method="POST" use:enhance class="space-y-6">
			<!-- Household Contact Info (first submission only) -->
			{#if !hasExistingRsvp}
			<div class="rounded-lg border border-burgundy-light bg-white p-6 shadow-sm">
				<p class="mb-1 text-sm font-semibold uppercase tracking-wide text-brown-light">
					{i18n.t.rsvpForm.householdContactTitle}
				</p>
				<p class="mb-4 text-xs text-brown-light">
					{i18n.t.rsvpForm.householdContactSubtitle}
				</p>

				<div class="grid gap-3 sm:grid-cols-2">
					<label class="block">
						<span class="mb-1 block text-xs text-brown-light"
							>{i18n.t.rsvpForm.email}
							{#if hasAdults}<span class="text-burgundy">*</span>{/if}</span
						>
						<input
							type="email"
							name="household.email"
							value=""
							required={hasAdults}
							placeholder="email@example.com"
							class="w-full rounded-md border-burgundy-light bg-ivory/50 px-3 py-2 text-sm text-brown placeholder:text-brown-light/50 focus:border-burgundy focus:ring-burgundy"
						/>
					</label>
					<label class="block">
						<span class="mb-1 block text-xs text-brown-light">{i18n.t.rsvpForm.phone}</span>
						<input
							type="tel"
							name="household.phone"
							value=""
							placeholder="(555) 123-4567"
							class="w-full rounded-md border-burgundy-light bg-ivory/50 px-3 py-2 text-sm text-brown placeholder:text-brown-light/50 focus:border-burgundy focus:ring-burgundy"
						/>
					</label>
				</div>

				<div class="mt-3">
					<span class="mb-1 block text-xs text-brown-light">{i18n.t.rsvpForm.mailingAddress}</span>
					<div class="grid gap-3">
						<input
							type="text"
							name="household.address_street"
							value=""
							placeholder={i18n.t.rsvpForm.streetAddress}
							class="w-full rounded-md border-burgundy-light bg-ivory/50 px-3 py-2 text-sm text-brown placeholder:text-brown-light/50 focus:border-burgundy focus:ring-burgundy"
						/>
						<div class="grid gap-3 sm:grid-cols-2">
							<input
								type="text"
								name="household.address_city"
								value=""
								placeholder={i18n.t.rsvpForm.city}
								class="rounded-md border-burgundy-light bg-ivory/50 px-3 py-2 text-sm text-brown placeholder:text-brown-light/50 focus:border-burgundy focus:ring-burgundy"
							/>
							<input
								type="text"
								name="household.address_state"
								value=""
								placeholder={i18n.t.rsvpForm.stateProvince}
								class="rounded-md border-burgundy-light bg-ivory/50 px-3 py-2 text-sm text-brown placeholder:text-brown-light/50 focus:border-burgundy focus:ring-burgundy"
							/>
						</div>
						<div class="grid gap-3 sm:grid-cols-2">
							<input
								type="text"
								name="household.address_country"
								value=""
								placeholder={i18n.t.rsvpForm.country}
								class="rounded-md border-burgundy-light bg-ivory/50 px-3 py-2 text-sm text-brown placeholder:text-brown-light/50 focus:border-burgundy focus:ring-burgundy"
							/>
							<input
								type="text"
								name="household.address_postal_code"
								value=""
								placeholder={i18n.t.rsvpForm.postalCode}
								class="rounded-md border-burgundy-light bg-ivory/50 px-3 py-2 text-sm text-brown placeholder:text-brown-light/50 focus:border-burgundy focus:ring-burgundy"
							/>
						</div>
					</div>
				</div>
			</div>
			{/if}

			<!-- Per-guest RSVP sections -->
			{#each data.household.guests as guest}
				<RsvpGuestForm
					{guest}
					existingRsvp={data.existingRsvps.find((r: { guest_id: string }) => r.guest_id === guest.id) ?? null}
					existingCeremonyInterest={data.existingCeremonyInterest.find((c: { guest_id: string }) => c.guest_id === guest.id) ?? null}
				/>
			{/each}

			<div class="text-center">
				<button
					type="submit"
					class="inline-block rounded-full border-2 border-burgundy bg-burgundy px-10 py-3 text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-burgundy-dark hover:border-burgundy-dark focus:outline-none focus:ring-2 focus:ring-burgundy focus:ring-offset-2"
				>
					{i18n.t.rsvpCode.submit}
				</button>
			</div>
		</form>
	{/if}
</section>
