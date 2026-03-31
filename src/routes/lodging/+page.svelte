<script lang="ts">
	import { COUPLE } from '$lib/config';
	import { i18n } from '$lib/i18n.svelte';
</script>

<svelte:head>
	<title>{i18n.t.lodging.title} — {COUPLE.partner1} & {COUPLE.partner2}</title>
</svelte:head>

<section class="mx-auto max-w-3xl px-4 py-16">
	<div class="mb-10 text-center">
		<h1 class="font-script text-4xl text-brown sm:text-5xl">{i18n.t.lodging.title}</h1>
		<div class="mx-auto mt-4 h-px w-16 bg-gold"></div>
		<p class="mt-4 text-brown-light">
			{i18n.t.lodging.subtitle}
		</p>
	</div>

	<div class="space-y-6">
		{#each i18n.t.lodging.hotels as hotel}
			<div class="rounded-lg border border-burgundy-light bg-white p-6 shadow-sm">
				<div class="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
					<h3 class="font-serif text-xl text-brown">{hotel.name}</h3>
					<span
						class="inline-block rounded-full bg-burgundy/20 px-3 py-1 text-sm font-semibold text-burgundy-dark"
					>
						{hotel.rate}
					</span>
				</div>
				<p class="mt-3 text-sm text-brown-light">{hotel.description}</p>
				<div class="mt-4 space-y-1 text-sm text-brown-light">
					<p>{hotel.address}</p>
					<p>{hotel.phone}</p>
					<a
						href={hotel.website}
						target="_blank"
						rel="noopener noreferrer"
						class="text-burgundy-dark hover:underline"
					>
						{i18n.t.lodging.visitWebsite}
					</a>
				</div>
			</div>
		{/each}
	</div>

	<div class="mt-12 rounded-lg border border-burgundy-light bg-burgundy-light/30 p-6 text-center">
		<p class="font-serif text-lg text-brown">{i18n.t.lodging.helpTitle}</p>
		<p class="mt-2 text-sm text-brown-light">
			{i18n.t.lodging.helpSubtitle}
		</p>
	</div>
</section>
