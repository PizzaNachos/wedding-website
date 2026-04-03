<script lang="ts">
	import { COUPLE, PROPOSAL_TRIP_IMAGES, STORY_IMAGES } from '$lib/config';
	import { i18n } from '$lib/i18n.svelte';
	import TimelineEntry from '$lib/components/TimelineEntry.svelte';

	type MultiPhotoCopy = { title: string; caption: string };

	function buildProposalMultiImages(multiPhotos?: MultiPhotoCopy[]) {
		const total = Math.max(PROPOSAL_TRIP_IMAGES.length, multiPhotos?.length ?? 0);
		return Array.from({ length: total }, (_, index) => {
			const copy = multiPhotos?.[index];
			return {
				image: PROPOSAL_TRIP_IMAGES[index] ?? '',
				imageAlt: copy?.title ?? `Proposal trip ${index + 1}`,
				title: copy?.title ?? `Trip ${index + 1}`,
				caption: copy?.caption ?? ''
			};
		});
	}
</script>

<svelte:head>
	<title>{i18n.t.story.title} &mdash; {COUPLE.partner1} & {COUPLE.partner2}</title>
</svelte:head>

<section class="page-shell page-shell--md page-section pb-8 text-center sm:pb-10">
	<h1 class="page-title font-script text-brown">{i18n.t.story.title}</h1>
	<div class="section-rule"></div>
	<p class="mt-4 leading-relaxed text-brown-light">
		{i18n.t.story.subtitle}
	</p>
</section>

<section class="page-shell page-shell--xl relative pb-16 sm:pb-20">
	<!-- Center vertical line (desktop only) -->
	<div
		class="absolute top-0 left-1/2 z-10 hidden h-full w-px -translate-x-1/2 bg-gold/40 md:block"
	></div>

	<!-- Top decorative diamond -->
	<div class="mx-auto mb-4 hidden h-3 w-3 rotate-45 border-2 border-gold bg-ivory md:block"></div>

	{#each i18n.t.story.entries as entry, i}
		<TimelineEntry
			date={entry.date}
			title={entry.title}
			description={entry.description}
			image={STORY_IMAGES[i].image}
			imageAlt={STORY_IMAGES[i].imageAlt}
			isMulti={entry.id === 'proposal'}
			multiImages={entry.id === 'proposal' ? buildProposalMultiImages(entry.multiPhotos) : undefined}
			index={i}
		/>
	{/each}

	<!-- Bottom decorative diamond -->
	<div class="mx-auto mt-4 hidden h-3 w-3 rotate-45 border-2 border-gold bg-ivory md:block"></div>
</section>

<section class="px-4 pb-16 text-center sm:pb-20">
	<p class="font-script text-2xl text-burgundy sm:text-3xl">
		{i18n.t.story.closing}
	</p>
</section>
