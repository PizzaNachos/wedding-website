<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.jpg';
	import Nav from '$lib/components/Nav.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import { COUPLE } from '$lib/config';

	let { data, children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<meta name="robots" content="noindex, nofollow" />
	<meta name="description" content="Wedding website for {COUPLE.partner1} & {COUPLE.partner2}" />
	<meta property="og:title" content="{COUPLE.partner1} & {COUPLE.partner2} — Our Wedding" />
	<meta
		property="og:description"
		content="Join us to celebrate our wedding! Find details, RSVP, and more."
	/>
	<meta property="og:type" content="website" />
</svelte:head>

{#if data.gateAuthenticated}
	<div class="flex min-h-screen flex-col">
		<Nav />
		<main class="flex-1">
			{@render children()}
		</main>
		<Footer />
	</div>
{:else}
	{@render children()}
{/if}
