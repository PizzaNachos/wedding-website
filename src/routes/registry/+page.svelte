<script lang="ts">
	import { COUPLE, VENMO_URL, GIFT_IDEAS } from '$lib/config';
	import { i18n } from '$lib/i18n.svelte';
	import GiftCard from '$lib/components/GiftCard.svelte';
</script>

<svelte:head>
	<title>{i18n.t.registry.title} — {COUPLE.partner1} & {COUPLE.partner2}</title>
</svelte:head>

<section class="mx-auto max-w-4xl px-4 py-16">
	<div class="mb-10 text-center">
		<h1 class="font-script text-4xl text-brown sm:text-5xl">{i18n.t.registry.title}</h1>
		<div class="mx-auto mt-4 h-px w-16 bg-gold"></div>
		<p class="mt-4 text-brown-light">
			{i18n.t.registry.subtitle}
		</p>
	</div>

	<!-- Venmo CTA -->
	<div class="mb-12 rounded-lg border border-burgundy-light bg-burgundy-light/30 p-8 text-center">
		<p class="mb-2 font-serif text-2xl text-brown">{i18n.t.registry.venmoTitle}</p>
		<p class="mb-6 text-sm text-brown-light">
			{i18n.t.registry.venmoSubtitle}
		</p>
		<a
			href={VENMO_URL}
			target="_blank"
			rel="noopener noreferrer"
			class="inline-block rounded-full bg-[#008CFF] px-8 py-3 text-sm font-semibold tracking-widest text-white uppercase transition-opacity hover:opacity-90"
		>
			{i18n.t.registry.venmoButton}
		</a>
	</div>

	<!-- Gift ideas grid -->
	<h2 class="mb-6 text-center font-serif text-2xl text-brown">{i18n.t.registry.giftTitle}</h2>
	<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
		{#each GIFT_IDEAS as gift}
			<GiftCard name={gift.name} price={gift.price} emoji={gift.emoji} image={gift.image} href={VENMO_URL} />
		{/each}
	</div>

	<p class="mt-8 text-center text-sm text-brown-light">
		{i18n.t.registry.giftFooter}
	</p>
</section>
