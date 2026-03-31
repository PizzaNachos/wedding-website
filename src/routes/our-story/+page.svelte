<script lang="ts">
	import { COUPLE, STORY_IMAGES } from '$lib/config';
	import { i18n } from '$lib/i18n.svelte';
	import TimelineEntry from '$lib/components/TimelineEntry.svelte';
</script>

<svelte:head>
	<title>{i18n.t.story.title} &mdash; {COUPLE.partner1} & {COUPLE.partner2}</title>
</svelte:head>

<section class="mx-auto max-w-3xl px-4 py-16 text-center">
	<h1 class="font-script text-4xl text-brown sm:text-5xl">{i18n.t.story.title}</h1>
	<div class="mx-auto mt-4 h-px w-16 bg-gold"></div>
	<p class="mt-4 text-brown-light">
		{i18n.t.story.subtitle}
	</p>
</section>

<section class="relative mx-auto max-w-5xl px-4 pb-20">
	<!-- Center vertical line (desktop only) -->
	<div
		class="absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-gold/40 md:block"
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
			index={i}
		/>
	{/each}

	<!-- Bottom decorative diamond -->
	<div class="mx-auto mt-4 hidden h-3 w-3 rotate-45 border-2 border-gold bg-ivory md:block"></div>
</section>

<section class="pb-20 text-center">
	<p class="font-script text-2xl text-burgundy sm:text-3xl">
		{i18n.t.story.closing}
	</p>
</section>
