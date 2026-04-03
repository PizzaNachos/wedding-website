<script lang="ts">
	interface MultiImageItem {
		image: string;
		imageAlt: string;
		title: string;
		caption: string;
	}

	interface Props {
		date: string;
		title: string;
		description: string;
		image: string;
		imageAlt: string;
		index: number;
		isMulti?: boolean;
		multiImages?: MultiImageItem[];
	}

	let {
		date,
		title,
		description,
		image,
		imageAlt,
		index,
		isMulti = false,
		multiImages = []
	}: Props = $props();

	let showFallback = $state(false);
	let multiFallbackIndexes = $state<number[]>([]);
	let visible = $state(false);
	let entryEl: HTMLElement | undefined = $state();

	const isEven = $derived(index % 2 === 0);

	function markMultiFallback(index: number) {
		if (multiFallbackIndexes.includes(index)) return;
		multiFallbackIndexes = [...multiFallbackIndexes, index];
	}

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
	class="relative grid grid-cols-1 gap-5 rounded-[1.75rem] bg-white/80 p-4 shadow-sm ring-1 ring-burgundy-light/50 transition-all duration-700 ease-out md:grid-cols-[1fr_auto_1fr] md:gap-10 md:rounded-none md:bg-transparent md:p-0 md:py-10 md:shadow-none md:ring-0 {visible
		? 'translate-y-0 opacity-100'
		: 'translate-y-6 opacity-0'}"
>
	<!-- Image -->
	<div
		class="{isEven ? 'md:order-1' : 'md:order-3'} flex {isMulti ? 'items-start' : 'items-center'}"
	>
		<div
			class={isMulti
				? 'w-full rounded-lg border border-burgundy-light bg-burgundy-light/20 p-2 shadow-md sm:p-3'
				: 'aspect-[4/3] w-full overflow-hidden rounded-lg border border-burgundy-light bg-burgundy-light/30 shadow-md'}
		>
			{#if isMulti}
				{#if multiImages.length > 0}
					<div class="grid grid-cols-2 gap-3">
						{#each multiImages as multiImage, multiIndex}
							<figure
								class="overflow-hidden rounded-md border border-burgundy-light/60 bg-ivory/70 {multiIndex ==
								2
									? 'col-span-2'
									: ''}"
							>
								<div class="aspect-[4/3] w-full overflow-hidden bg-burgundy-light/20">
									{#if multiImage.image && !multiFallbackIndexes.includes(multiIndex)}
										<img
											src={multiImage.image}
											alt={multiImage.imageAlt}
											class="h-full w-full object-cover"
											loading="lazy"
											onerror={() => markMultiFallback(multiIndex)}
										/>
									{/if}
									{#if !multiImage.image || multiFallbackIndexes.includes(multiIndex)}
										<div class="flex h-full w-full items-center justify-center">
											<span class="text-4xl text-burgundy/30">&#128247;</span>
										</div>
									{/if}
								</div>
								<figcaption class="px-3 py-2">
									<p
										class="text-[0.68rem] font-semibold tracking-[0.16em] text-gold-dark uppercase"
									>
										{multiImage.title}
									</p>
									{#if multiImage.caption}
										<p class="mt-1 text-xs leading-relaxed text-brown-light">
											{multiImage.caption}
										</p>
									{/if}
								</figcaption>
							</figure>
						{/each}
					</div>
				{:else}
					<div class="flex aspect-[4/3] w-full items-center justify-center rounded-md bg-ivory/70">
						<span class="text-5xl text-burgundy/30">&#128247;</span>
					</div>
				{/if}
			{:else}
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
			: 'md:order-1 md:text-right'} flex flex-col justify-center text-center"
	>
		<span class="text-[0.68rem] font-light tracking-[0.2em] text-gold-dark uppercase sm:text-xs">
			{date}
		</span>
		<h3 class="mt-2 font-serif text-2xl text-brown sm:text-3xl">{title}</h3>
		<div class="mx-auto mt-3 h-px w-12 bg-gold {isEven ? '' : 'md:ml-auto'}"></div>
		<p class="mt-4 leading-relaxed text-brown-light">{description}</p>
	</div>
</div>
