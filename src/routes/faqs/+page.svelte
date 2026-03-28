<script lang="ts">
	import { COUPLE } from '$lib/config';
	import Accordion from '$lib/components/Accordion.svelte';
	import AccordionItem from '$lib/components/AccordionItem.svelte';

	const faqs = [
		{
			question: 'What is the dress code?',
			answer:
				'We kindly request semi-formal/cocktail attire. Think elegant but comfortable — you will be celebrating with us all evening!'
		},
		{
			question: 'Can I bring a plus one?',
			answer:
				'Due to venue capacity, we can only accommodate those listed on your invitation. If you received a plus one, it will be indicated on your RSVP.'
		},
		{
			question: 'Will there be parking at the venue?',
			answer:
				'Yes! Free parking is available at the venue. We also recommend rideshare services if you plan to enjoy the open bar.'
		},
		{
			question: 'Is the venue wheelchair accessible?',
			answer:
				'Yes, the venue is fully accessible. Please let us know if you have any specific accessibility needs and we will make sure everything is arranged.'
		},
		{
			question: 'What time should I arrive?',
			answer:
				'We recommend arriving 15-20 minutes before the ceremony start time. This allows time to find your seat and settle in.'
		},
		{
			question: 'Will there be an open bar?',
			answer:
				'Yes! We will have a full open bar during the reception with beer, wine, cocktails, and non-alcoholic options.'
		},
		{
			question: 'Can I take photos during the ceremony?',
			answer:
				'We kindly ask for an unplugged ceremony — please turn off phones and cameras. Our photographer will capture every moment! You are welcome to take photos during the reception.'
		},
		{
			question: "What if I can't make it?",
			answer:
				'We will miss you! Please update your RSVP using the link from your invitation so we can plan accordingly.'
		}
	];
</script>

<svelte:head>
	<title>FAQs — {COUPLE.partner1} & {COUPLE.partner2}</title>
</svelte:head>

<section class="mx-auto max-w-3xl px-4 py-16">
	<div class="mb-10 text-center">
		<h1 class="font-script text-4xl text-brown sm:text-5xl">Questions & Answers</h1>
		<div class="mx-auto mt-4 h-px w-16 bg-gold"></div>
		<p class="mt-4 text-brown-light">
			Everything you need to know about our big day.
		</p>
	</div>

	<Accordion>
		{#each faqs as faq}
			<AccordionItem title={faq.question}>
				<p>{faq.answer}</p>
			</AccordionItem>
		{/each}
	</Accordion>

	<div class="mt-12 text-center">
		<p class="text-brown-light">
			Still have questions? Don't hesitate to reach out to us directly!
		</p>
	</div>
</section>
