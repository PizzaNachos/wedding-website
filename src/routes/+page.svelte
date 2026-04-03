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

<section class="page-shell page-shell--md page-section text-center">
	<h2 class="mb-5 font-serif text-2xl text-brown sm:text-3xl">{i18n.t.home.welcome}</h2>
	<div class="mx-auto prose prose-lg max-w-none text-brown-light prose-p:leading-relaxed">
		<p>{i18n.t.home.body1}</p>
		<p>{i18n.t.home.body2}</p>
	</div>
</section>
