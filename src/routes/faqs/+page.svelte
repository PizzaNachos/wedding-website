<script lang="ts">
	import { COUPLE } from '$lib/config';
	import { i18n } from '$lib/i18n.svelte';
	import Accordion from '$lib/components/Accordion.svelte';
	import AccordionItem from '$lib/components/AccordionItem.svelte';
</script>

<svelte:head>
	<title>{i18n.t.faqs.title} — {COUPLE.partner1} & {COUPLE.partner2}</title>
</svelte:head>

<section class="mx-auto max-w-3xl px-4 py-16">
	<div class="mb-10 text-center">
		<h1 class="font-script text-4xl text-brown sm:text-5xl">{i18n.t.faqs.title}</h1>
		<div class="mx-auto mt-4 h-px w-16 bg-gold"></div>
		<p class="mt-4 text-brown-light">
			{i18n.t.faqs.subtitle}
		</p>
	</div>

	<Accordion>
		{#each i18n.t.faqs.questions as faq}
			<AccordionItem title={faq.question}>
				<p>{faq.answer}</p>
			</AccordionItem>
		{/each}
	</Accordion>

	<div class="mt-12 text-center">
		<p class="text-brown-light">
			{i18n.t.faqs.footer}
		</p>
	</div>
</section>
