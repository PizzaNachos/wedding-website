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

<section class="mx-auto max-w-xl px-4 py-24 text-center">
	<h1 class="font-script text-4xl text-brown sm:text-5xl">{i18n.t.rsvp.title}</h1>
	<div class="mx-auto mt-4 h-px w-16 bg-gold"></div>
	<p class="mt-8 text-brown-light">
		{i18n.t.rsvp.instructions}
	</p>

	<form method="POST" use:enhance class="mt-8 space-y-4">
		<input
			type="text"
			name="name"
			bind:value={nameValue}
			placeholder={i18n.t.rsvp.placeholder}
			required
			class="w-full rounded-md border border-burgundy-light bg-ivory/50 px-4 py-3 text-center text-brown placeholder:text-brown-light/50 focus:border-burgundy focus:outline-none focus:ring-1 focus:ring-burgundy"
		/>
		<button
			type="submit"
			class="inline-block rounded-full border-2 border-burgundy bg-burgundy px-10 py-3 text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-burgundy-dark hover:border-burgundy-dark focus:outline-none focus:ring-2 focus:ring-burgundy focus:ring-offset-2"
		>
			{i18n.t.rsvp.button}
		</button>
	</form>

	{#if form?.message}
		<p class="mt-6 text-brown-light">{form.message}</p>
	{/if}
</section>
