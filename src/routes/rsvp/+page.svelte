<script lang="ts">
	import { enhance } from '$app/forms';
	import { COUPLE } from '$lib/config';
	import { i18n } from '$lib/i18n.svelte';
	import { guestSession } from '$lib/guest-session.svelte';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();

	let nameValue = $state(
		guestSession.current
			? `${guestSession.current.first_name}${guestSession.current.last_name ? ' ' + guestSession.current.last_name : ''}`
			: ''
	);
</script>

<svelte:head>
	<title>{i18n.t.rsvp.title} — {COUPLE.partner1} & {COUPLE.partner2}</title>
</svelte:head>

<section class="page-shell page-shell--sm px-4 py-16 text-center sm:py-24">
	<h1 class="page-title font-script text-brown">{i18n.t.rsvp.title}</h1>
	<div class="section-rule"></div>
	<p class="mt-8 leading-relaxed text-brown-light">
		{i18n.t.rsvp.instructions}
	</p>

	<form method="POST" use:enhance class="mt-8 space-y-4">
		<input
			type="text"
			name="name"
			bind:value={nameValue}
			placeholder={i18n.t.rsvp.placeholder}
			required
			class="touch-target w-full rounded-md border border-burgundy-light bg-ivory/50 px-4 py-3 text-center text-brown placeholder:text-brown-light/50 focus:border-burgundy focus:ring-1 focus:ring-burgundy focus:outline-none"
		/>
		<button
			type="submit"
			class="touch-target inline-flex w-full items-center justify-center rounded-full border-2 border-burgundy bg-burgundy px-10 py-3 text-sm font-semibold tracking-[0.22em] text-white uppercase transition-colors hover:border-burgundy-dark hover:bg-burgundy-dark focus:ring-2 focus:ring-burgundy focus:ring-offset-2 focus:outline-none sm:w-auto"
		>
			{i18n.t.rsvp.button}
		</button>
	</form>

	{#if form?.message}
		<p class="mt-6 text-brown-light">{form.message}</p>
	{/if}

	{#if form?.choices && form.choices.length > 0}
		<div class="mt-8 space-y-4 text-left">
			<div class="text-center">
				<h2 class="font-serif text-2xl text-brown">{i18n.t.rsvp.chooserTitle}</h2>
				<p class="mt-2 text-sm leading-relaxed text-brown-light">
					{i18n.t.rsvp.chooserSubtitle}
				</p>
			</div>

			<div class="space-y-3">
				{#each form.choices as choice}
					<a
						href={`/rsvp/${choice.householdCode}`}
						class="block rounded-[1.5rem] border border-burgundy-light bg-white p-4 text-brown shadow-sm transition-colors hover:border-burgundy hover:bg-ivory/40 focus:ring-2 focus:ring-burgundy focus:ring-offset-2 focus:outline-none"
					>
						<div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
							<div class="min-w-0">
								<p class="font-serif text-xl text-brown">{choice.householdName}</p>
								<p class="mt-2 text-xs font-semibold tracking-[0.18em] text-brown-light uppercase">
									{i18n.t.rsvp.chooserGuestsLabel}
								</p>
								<ul class="mt-1 space-y-1 text-sm leading-relaxed text-brown-light">
									{#each choice.guests as guest}
										<li>{guest.first_name} {guest.last_name}</li>
									{/each}
								</ul>
							</div>
							<span
								class="inline-flex shrink-0 items-center justify-center rounded-full border border-burgundy bg-burgundy/10 px-4 py-2 text-center text-xs font-semibold tracking-[0.18em] text-burgundy uppercase"
							>
								{i18n.t.rsvp.chooserButton}
							</span>
						</div>
					</a>
				{/each}
			</div>
		</div>
	{/if}
</section>
