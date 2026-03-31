<script lang="ts">
	import Hero from '$lib/components/Hero.svelte';
	import Countdown from '$lib/components/Countdown.svelte';
	import { COUPLE } from '$lib/config';
	import { i18n } from '$lib/i18n.svelte';
</script>

<svelte:head>
	<title>{COUPLE.partner1} & {COUPLE.partner2} — {i18n.t.nav.title}</title>
</svelte:head>

<Hero />
<Countdown />

<section class="mx-auto max-w-2xl px-4 py-16 text-center">
	<h2 class="mb-6 font-serif text-2xl text-brown sm:text-3xl">{i18n.t.home.welcome}</h2>
	<div class="prose prose-lg mx-auto text-brown-light">
		<p>{i18n.t.home.body1}</p>
		<p>{i18n.t.home.body2}</p>
	</div>
</section>
