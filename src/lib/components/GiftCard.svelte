<script lang="ts">
	interface Props {
		name: string;
		price: number;
		emoji: string;
		image?: string;
		href?: string;
	}

	let { name, price, emoji, image, href }: Props = $props();

	let showFallback = $state(false);
	let loaded = $state(false);
</script>

<a
	{href}
	target="_blank"
	rel="noopener noreferrer"
	class="block overflow-hidden rounded-2xl border border-burgundy-light bg-white shadow-sm transition-transform hover:scale-[1.02]"
>
	<div class="flex aspect-square items-center justify-center overflow-hidden bg-ivory">
		{#if image && !showFallback}
			<img
				src={image}
				alt={name}
				class="h-full w-full object-cover"
				class:hidden={showFallback}
				loading="lazy"
				onload={() => (loaded = true)}
				onerror={() => (showFallback = true)}
			/>
		{/if}
		{#if !image || showFallback || !loaded}
			<span class="text-4xl sm:text-5xl">{emoji}</span>
		{/if}
	</div>
	<div class="p-4 text-center">
		<h3 class="font-serif text-base leading-snug text-brown">{name}</h3>
		<p class="mt-1 text-sm font-semibold text-brown-light">${price}</p>
	</div>
</a>
