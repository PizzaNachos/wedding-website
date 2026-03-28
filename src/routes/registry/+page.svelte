<script lang="ts">
	import { COUPLE, VENMO_URL, GIFT_IDEAS } from '$lib/config';
	import GiftCard from '$lib/components/GiftCard.svelte';
</script>

<svelte:head>
	<title>Registry — {COUPLE.partner1} & {COUPLE.partner2}</title>
</svelte:head>

<section class="mx-auto max-w-4xl px-4 py-16">
	<div class="mb-10 text-center">
		<h1 class="font-script text-4xl text-brown sm:text-5xl">Registry</h1>
		<div class="mx-auto mt-4 h-px w-16 bg-gold"></div>
		<p class="mt-4 text-brown-light">
			Your presence is the greatest gift of all. But if you'd like to contribute to our new life
			together, here are some ideas that inspire us.
		</p>
	</div>

	<!-- Venmo CTA -->
	<div class="mb-12 rounded-lg border border-burgundy-light bg-burgundy-light/30 p-8 text-center">
		<p class="mb-2 font-serif text-2xl text-brown">Send a Gift via Venmo</p>
		<p class="mb-6 text-sm text-brown-light">
			Feel free to include a note with which "gift" inspired you!
		</p>
		<a
			href={VENMO_URL}
			target="_blank"
			rel="noopener noreferrer"
			class="inline-block rounded-full bg-[#008CFF] px-8 py-3 text-sm font-semibold uppercase tracking-widest text-white transition-opacity hover:opacity-90"
		>
			Open Venmo
		</a>
	</div>

	<!-- Gift ideas grid -->
	<h2 class="mb-6 text-center font-serif text-2xl text-brown">Gift Inspiration</h2>
	<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
		{#each GIFT_IDEAS as gift}
			<GiftCard name={gift.name} price={gift.price} emoji={gift.emoji} image={gift.image} />
		{/each}
	</div>

	<p class="mt-8 text-center text-sm text-brown-light">
		These are just ideas for inspiration — any amount is deeply appreciated!
	</p>
</section>
