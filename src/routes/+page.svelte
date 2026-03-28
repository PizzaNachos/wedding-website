<script lang="ts">
	import Hero from '$lib/components/Hero.svelte';
	import Countdown from '$lib/components/Countdown.svelte';
	import { COUPLE } from '$lib/config';
</script>

<svelte:head>
	<title>{COUPLE.partner1} & {COUPLE.partner2} — Our Wedding</title>
</svelte:head>

<Hero />
<Countdown />

<section class="mx-auto max-w-2xl px-4 py-16 text-center">
	<h2 class="mb-6 font-serif text-2xl text-brown sm:text-3xl">Welcome</h2>
	<div class="prose prose-lg mx-auto text-brown-light">
		<p>
			We are so excited to celebrate our special day with you! Please explore the site for all the
			details about our wedding, and don't forget to RSVP using the unique link from your
			invitation.
		</p>
		<p>We can't wait to see you there!</p>
	</div>
</section>
