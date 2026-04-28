<script lang="ts">
	import { COUPLE, VENMO_URL, CRATE_AND_BARREL_URL, GIFT_IDEAS } from '$lib/config';
	import { i18n } from '$lib/i18n.svelte';
	import GiftCard from '$lib/components/GiftCard.svelte';
</script>

<svelte:head>
	<title>{i18n.t.registry.title} — {COUPLE.partner1} & {COUPLE.partner2}</title>
</svelte:head>

<section class="page-shell page-shell--lg page-section">
	<div class="mb-10 text-center">
		<h1 class="page-title font-script text-brown">{i18n.t.registry.title}</h1>
		<div class="section-rule"></div>
		<p class="mt-4 text-lg leading-relaxed text-brown-light">
			{i18n.t.registry.subtitle}
		</p>
	</div>

	<!-- Two-column registry cards -->
	<div class="mb-10 grid grid-cols-1 gap-6 sm:mb-12 md:grid-cols-2">
		<!-- Cash / Venmo Registry -->
		<div
			class="flex flex-col rounded-2xl border border-burgundy-light bg-burgundy-light/30 p-5 text-center sm:p-8"
		>
			<p class="mb-2 font-serif text-2xl text-brown">{i18n.t.registry.cashTitle}</p>
			<p class="mb-6 text-sm text-brown-light">
				{i18n.t.registry.cashSubtitle}
			</p>
			<div class="mt-auto">
				<a
					href={VENMO_URL}
					target="_blank"
					rel="noopener noreferrer"
					class="touch-target inline-flex w-full items-center justify-center rounded-full bg-[#008CFF] px-8 py-3 text-sm font-semibold tracking-[0.22em] text-white uppercase transition-opacity hover:opacity-90 sm:w-auto"
				>
					{i18n.t.registry.cashButton}
				</a>
			</div>
		</div>

		<!-- Crate & Barrel Registry -->
		<div
			class="flex flex-col rounded-2xl border border-burgundy-light bg-burgundy-light/30 p-5 text-center sm:p-8"
		>
			<p class="mb-2 font-serif text-2xl text-brown">{i18n.t.registry.registryTitle}</p>
			<p class="mb-6 text-sm text-brown-light">
				{i18n.t.registry.registrySubtitle}
			</p>
			<div class="mt-auto">
				<a
					href={CRATE_AND_BARREL_URL}
					target="_blank"
					rel="noopener noreferrer"
					class="touch-target inline-flex w-full items-center justify-center rounded-full bg-brown px-8 py-3 text-sm font-semibold tracking-[0.22em] text-white uppercase transition-opacity hover:opacity-90 sm:w-auto"
				>
					{i18n.t.registry.registryButton}
				</a>
			</div>
		</div>
	</div>

	<!-- Gift ideas grid -->
	<!-- <h2 class="mb-6 text-center font-serif text-2xl text-brown">{i18n.t.registry.giftTitle}</h2>
	<div class="grid grid-cols-1 gap-4 min-[380px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
		{#each GIFT_IDEAS as gift}
			<GiftCard
				name={gift.name}
				price={gift.price}
				emoji={gift.emoji}
				image={gift.image}
				href={VENMO_URL}
			/>
		{/each}
	</div> -->

	<!-- <p class="mt-8 text-center text-sm text-brown-light">
		{i18n.t.registry.giftFooter}
	</p> -->
</section>
