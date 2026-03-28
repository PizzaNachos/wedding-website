<script lang="ts">
	import { COUPLE } from '$lib/config';

	const hotels = [
		{
			name: 'The Grand Hotel',
			address: '123 Main Street, City, State 12345',
			phone: '(555) 123-4567',
			website: 'https://example.com',
			description:
				'Our recommended hotel, just 5 minutes from the venue. We have a room block reserved — mention our wedding when booking for a discounted rate.',
			rate: '$149/night'
		},
		{
			name: 'Comfort Inn & Suites',
			address: '456 Oak Avenue, City, State 12345',
			phone: '(555) 987-6543',
			website: 'https://example.com',
			description: 'A budget-friendly option about 10 minutes from the venue with free breakfast.',
			rate: '$99/night'
		},
		{
			name: 'Charming Bed & Breakfast',
			address: '789 Elm Street, City, State 12345',
			phone: '(555) 456-7890',
			website: 'https://example.com',
			description:
				'For those looking for something extra special — a cozy B&B with beautiful gardens, 15 minutes from the venue.',
			rate: '$179/night'
		}
	];
</script>

<svelte:head>
	<title>Lodging — {COUPLE.partner1} & {COUPLE.partner2}</title>
</svelte:head>

<section class="mx-auto max-w-3xl px-4 py-16">
	<div class="mb-10 text-center">
		<h1 class="font-script text-4xl text-brown sm:text-5xl">Lodging</h1>
		<div class="mx-auto mt-4 h-px w-16 bg-gold"></div>
		<p class="mt-4 text-brown-light">
			Here are some nearby accommodations for your stay. We recommend booking early!
		</p>
	</div>

	<div class="space-y-6">
		{#each hotels as hotel}
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
						Visit Website
					</a>
				</div>
			</div>
		{/each}
	</div>

	<div class="mt-12 rounded-lg border border-burgundy-light bg-burgundy-light/30 p-6 text-center">
		<p class="font-serif text-lg text-brown">Need help with travel arrangements?</p>
		<p class="mt-2 text-sm text-brown-light">
			Don't hesitate to reach out — we're happy to help!
		</p>
	</div>
</section>
