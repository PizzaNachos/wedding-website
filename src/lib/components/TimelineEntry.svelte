<script lang="ts">
	interface Props {
		date: string;
		title: string;
		description: string;
		image: string;
		imageAlt: string;
		index: number;
	}

	let { date, title, description, image, imageAlt, index }: Props = $props();

	let showFallback = $state(false);
	let visible = $state(false);
	let entryEl: HTMLElement | undefined = $state();

	const isEven = $derived(index % 2 === 0);

	$effect(() => {
		if (!entryEl) return;
		const observer = new IntersectionObserver(
			([e]) => {
				if (e.isIntersecting) {
					visible = true;
					observer.disconnect();
				}
			},
			{ threshold: 0.15 }
		);
		observer.observe(entryEl);
		return () => observer.disconnect();
	});
</script>

<div
	bind:this={entryEl}
	class="relative grid grid-cols-1 gap-6 py-10 md:grid-cols-[1fr_auto_1fr] md:gap-10 transition-all duration-700 ease-out {visible
		? 'opacity-100 translate-y-0'
		: 'opacity-0 translate-y-6'}"
>
	<!-- Image -->
	<div class="{isEven ? 'md:order-1' : 'md:order-3'} flex items-center">
		<div
			class="aspect-[4/3] w-full overflow-hidden rounded-lg border border-burgundy-light bg-burgundy-light/30 shadow-md"
		>
			{#if image && !showFallback}
				<img
					src={image}
					alt={imageAlt}
					class="h-full w-full object-cover"
					loading="lazy"
					onerror={() => (showFallback = true)}
				/>
			{/if}
			{#if !image || showFallback}
				<div class="flex h-full w-full items-center justify-center">
					<span class="text-5xl text-burgundy/30">&#128247;</span>
				</div>
			{/if}
		</div>
	</div>

	<!-- Center dot -->
	<div class="hidden md:order-2 md:flex md:items-center md:justify-center">
		<div class="relative z-10 h-4 w-4 rounded-full border-2 border-gold bg-ivory"></div>
	</div>

	<!-- Text content -->
	<div
		class="{isEven
			? 'md:order-3 md:text-left'
			: 'md:order-1 md:text-right'} flex flex-col justify-center"
	>
		<span class="text-xs font-light uppercase tracking-[0.2em] text-gold-dark">{date}</span>
		<h3 class="mt-2 font-serif text-2xl text-brown sm:text-3xl">{title}</h3>
		<div class="mt-3 h-px w-12 bg-gold {isEven ? '' : 'md:ml-auto'}"></div>
		<p class="mt-4 leading-relaxed text-brown-light">{description}</p>
	</div>
</div>
