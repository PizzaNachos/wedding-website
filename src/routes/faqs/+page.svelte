<script lang="ts">
	import { COUPLE } from '$lib/config';
	import { i18n } from '$lib/i18n.svelte';
	import Accordion from '$lib/components/Accordion.svelte';
	import AccordionItem from '$lib/components/AccordionItem.svelte';
</script>

<svelte:head>
	<title>{i18n.t.faqs.title} — {COUPLE.partner1} & {COUPLE.partner2}</title>
</svelte:head>

<section class="page-shell page-shell--md page-section">
	<div class="mb-10 text-center">
		<h1 class="page-title font-script text-brown">{i18n.t.faqs.title}</h1>
		<div class="section-rule"></div>
		<p class="mt-4 leading-relaxed text-brown-light">
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
