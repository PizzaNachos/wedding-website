<script lang="ts">
	import { WEDDING_DATE } from '$lib/config';
	import { i18n } from '$lib/i18n.svelte';

	let now = $state(new Date());

	$effect(() => {
		const interval = setInterval(() => {
			now = new Date();
		}, 1000);
		return () => clearInterval(interval);
	});

	const diff = $derived(WEDDING_DATE.getTime() - now.getTime());
	const isPast = $derived(diff <= 0);
	const days = $derived(Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24))));
	const hours = $derived(Math.max(0, Math.floor((diff / (1000 * 60 * 60)) % 24)));
	const minutes = $derived(Math.max(0, Math.floor((diff / (1000 * 60)) % 60)));
	const seconds = $derived(Math.max(0, Math.floor((diff / 1000) % 60)));
</script>

<section class="bg-ivory px-4 py-16 text-center">
	{#if isPast}
		<p class="font-serif text-2xl text-burgundy-dark">{i18n.t.countdown.married}</p>
	{:else}
		<h2 class="mb-8 font-serif text-2xl text-brown sm:text-3xl">{i18n.t.countdown.title}</h2>
		<div class="mx-auto flex max-w-md justify-center gap-4 sm:gap-8">
			{#each [
				{ value: days, label: i18n.t.countdown.days },
				{ value: hours, label: i18n.t.countdown.hours },
				{ value: minutes, label: i18n.t.countdown.minutes },
				{ value: seconds, label: i18n.t.countdown.seconds }
			] as unit}
				<div class="flex flex-col items-center">
					<span
						class="flex h-16 w-16 items-center justify-center rounded-full border border-burgundy/30 bg-burgundy-light/50 font-serif text-2xl text-brown sm:h-20 sm:w-20 sm:text-3xl"
					>
						{String(unit.value).padStart(2, '0')}
					</span>
					<span class="mt-2 text-xs font-light uppercase tracking-widest text-brown-light">
						{unit.label}
					</span>
				</div>
			{/each}
		</div>
	{/if}
</section>
