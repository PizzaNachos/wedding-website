<script lang="ts">
	import { COUPLE, WILD_BASIN_LODGING_URL } from '$lib/config';
	import { i18n } from '$lib/i18n.svelte';
</script>

<svelte:head>
	<title>{i18n.t.lodging.title} — {COUPLE.partner1} & {COUPLE.partner2}</title>
</svelte:head>

<section class="page-shell page-shell--md page-section">
	<div class="mb-10 text-center">
		<h1 class="page-title font-script text-brown">{i18n.t.lodging.title}</h1>
		<div class="section-rule"></div>
		<p class="mt-4 leading-relaxed text-brown-light">
			{i18n.t.lodging.subtitle}
		</p>
	</div>

	<div class="rounded-2xl border border-burgundy-light bg-burgundy-light/30 p-5 text-center sm:p-8">
		<span
			class="inline-flex min-h-11 items-center rounded-full bg-white px-4 py-1.5 text-xs font-semibold tracking-[0.18em] text-burgundy-dark uppercase shadow-sm"
		>
			{i18n.t.lodging.featuredBadge}
		</span>
		<h2 class="mt-4 font-serif text-2xl text-brown sm:text-3xl">
			{i18n.t.lodging.featuredTitle}
		</h2>
		<p class="mx-auto mt-4 max-w-2xl leading-relaxed text-brown-light">
			{i18n.t.lodging.featuredBody}
		</p>
		<a
			href={WILD_BASIN_LODGING_URL}
			target="_blank"
			rel="noopener noreferrer"
			class="touch-target mt-6 inline-flex w-full items-center justify-center rounded-full bg-burgundy px-8 py-3 text-sm font-semibold tracking-[0.22em] text-white uppercase transition-colors hover:bg-burgundy-dark sm:w-auto"
		>
			{i18n.t.lodging.featuredCta}
		</a>
		<p class="mx-auto mt-4 max-w-2xl text-sm text-brown-light">
			{i18n.t.lodging.featuredDisclaimer}
		</p>
	</div>

	<div
		class="mt-10 rounded-2xl border border-burgundy-light bg-burgundy-light/30 p-5 text-center sm:mt-12 sm:p-6"
	>
		<p class="font-serif text-lg text-brown">{i18n.t.lodging.helpTitle}</p>
		<p class="mt-2 text-sm text-brown-light">
			{i18n.t.lodging.helpSubtitle}
		</p>
	</div>
</section>
