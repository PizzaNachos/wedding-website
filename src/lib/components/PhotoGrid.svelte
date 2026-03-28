<script lang="ts">
	import PhotoSkeleton from './PhotoSkeleton.svelte';
	import ScrollSentinel from './ScrollSentinel.svelte';

	interface Props {
		photos: { url: string; fullUrl?: string; originalUrl?: string; name: string }[];
		total: number;
		loading: boolean;
		hasMore: boolean;
		onLoadMore: () => void;
	}

	let { photos, total, loading, hasMore, onLoadMore }: Props = $props();

	let columnCount = $state(2);

	function updateColumnCount() {
		if (window.innerWidth >= 1024) columnCount = 4;
		else if (window.innerWidth >= 640) columnCount = 3;
		else columnCount = 2;
	}

	$effect(() => {
		updateColumnCount();
		window.addEventListener('resize', updateColumnCount);
		return () => window.removeEventListener('resize', updateColumnCount);
	});

	// Distribute photos round-robin across columns (row-first order)
	let columns = $derived.by(() => {
		const cols: { photo: (typeof photos)[0]; index: number }[][] = Array.from(
			{ length: columnCount },
			() => []
		);
		for (let i = 0; i < photos.length; i++) {
			cols[i % columnCount].push({ photo: photos[i], index: i });
		}
		return cols;
	});

	let selectedIndex = $state<number | null>(null);
	let selectedPhoto = $derived(selectedIndex !== null ? photos[selectedIndex] : null);
	let imageLoading = $state(false);

	function openLightbox(index: number) {
		imageLoading = true;
		selectedIndex = index;
	}

	function closeLightbox() {
		selectedIndex = null;
		imageLoading = false;
	}

	function prev() {
		if (selectedIndex === null || selectedIndex <= 0) return;
		imageLoading = true;
		selectedIndex--;
	}

	function next() {
		if (selectedIndex === null) return;

		// Prefetch next batch when near the end
		if (selectedIndex >= photos.length - 3 && hasMore) {
			onLoadMore();
		}

		if (selectedIndex < photos.length - 1) {
			imageLoading = true;
			selectedIndex++;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (selectedIndex === null) return;

		switch (e.key) {
			case 'ArrowLeft':
				e.preventDefault();
				prev();
				break;
			case 'ArrowRight':
				e.preventDefault();
				next();
				break;
			case 'Escape':
				e.preventDefault();
				closeLightbox();
				break;
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if photos.length === 0 && !loading}
	<p class="py-8 text-center text-brown-light">No photos yet.</p>
{:else}
	<div class="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
		{#each columns as column}
			<div class="flex flex-col gap-3">
				{#each column as { photo, index }}
					<button
						class="block w-full overflow-hidden rounded-lg shadow-sm transition-transform hover:scale-[1.02]"
						onclick={() => openLightbox(index)}
					>
						<img src={photo.url} alt={photo.name} class="w-full object-cover" loading="lazy" />
					</button>
				{/each}
			</div>
		{/each}

		{#if loading}
			<PhotoSkeleton />
		{/if}
	</div>

	<ScrollSentinel onIntersect={onLoadMore} disabled={!hasMore || loading} />

	<p class="mt-4 text-center text-sm text-brown-light">
		Showing {photos.length} of {total} photos
	</p>
{/if}

<!-- Lightbox -->
{#if selectedPhoto}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-brown/80 p-4"
		role="dialog"
		aria-modal="true"
	>
		<!-- Backdrop close -->
		<button class="absolute inset-0" onclick={closeLightbox} aria-label="Close lightbox"></button>

		<div class="relative">
			<img
				src={selectedPhoto.fullUrl ?? selectedPhoto.url}
				alt=""
				class="max-h-[90vh] max-w-[90vw] rounded-lg transition-opacity duration-300 {imageLoading
					? 'opacity-0'
					: 'opacity-100'}"
				onload={() => (imageLoading = false)}
				onerror={() => (imageLoading = false)}
			/>
			{#if imageLoading}
				<div class="absolute inset-0 flex items-center justify-center">
					<div
						class="h-10 w-10 animate-spin rounded-full border-4 border-white/30 border-t-white"
					></div>
				</div>
			{/if}

			<!-- Download -->
			<a
				href={selectedPhoto.originalUrl ?? selectedPhoto.fullUrl ?? selectedPhoto.url}
				download
				class="absolute -bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-medium text-brown shadow-md transition-colors hover:bg-burgundy hover:text-white"
				aria-label="Download photo"
			>
				<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2m-4-4l-4 4m0 0l-4-4m4 4V4"
					></path>
				</svg>
				Download
			</a>

			<!-- Close button -->
			<button
				class="absolute -top-3 -right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white text-brown shadow-md hover:bg-burgundy-light"
				onclick={closeLightbox}
				aria-label="Close"
			>
				&times;
			</button>
		</div>

		<!-- Prev button -->
		{#if selectedIndex !== null && selectedIndex > 0}
			<button
				class="absolute top-1/2 left-4 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-brown shadow-md transition-colors hover:bg-white"
				onclick={prev}
				aria-label="Previous photo"
			>
				<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M15 19l-7-7 7-7"
					/>
				</svg>
			</button>
		{/if}

		<!-- Next button -->
		{#if selectedIndex !== null && selectedIndex < photos.length - 1}
			<button
				class="absolute top-1/2 right-4 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-brown shadow-md transition-colors hover:bg-white"
				onclick={next}
				aria-label="Next photo"
			>
				<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
				</svg>
			</button>
		{/if}
	</div>
{/if}
