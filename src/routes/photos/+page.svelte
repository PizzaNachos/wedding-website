<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { COUPLE } from '$lib/config';
	import PhotoGrid from '$lib/components/PhotoGrid.svelte';
	import PhotoUpload from '$lib/components/PhotoUpload.svelte';
	import { PhotoGalleryState } from '$lib/photo-gallery-state.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Top-level view: gallery or upload
	let view = $state<'gallery' | 'upload'>('gallery');

	// Gallery state manager
	const gallery = new PhotoGalleryState();

	// Initialize and re-initialize when SSR data changes (e.g. after invalidateAll)
	$effect(() => {
		gallery.init(data);
	});

	// Gallery tabs
	const tabs: { id: 'engagement' | 'ceremony' | 'reception' | 'guest'; label: string }[] = [
		{ id: 'engagement', label: 'Engagement' },
		{ id: 'ceremony', label: 'Ceremony' },
		{ id: 'reception', label: 'Reception' },
		{ id: 'guest', label: 'Guest Photos' }
	];
</script>

<svelte:head>
	<title>Photos — {COUPLE.partner1} & {COUPLE.partner2}</title>
</svelte:head>

<section class="mx-auto max-w-5xl px-4 py-16">
	<div class="mb-10 text-center">
		<h1 class="font-script text-4xl text-brown sm:text-5xl">Photos</h1>
		<div class="mx-auto mt-4 h-px w-16 bg-gold"></div>
	</div>

	<!-- View toggle: Gallery / Upload -->
	<div class="mb-8 flex justify-center gap-2">
		<button
			class="rounded-full px-6 py-2 text-sm font-semibold tracking-widest uppercase transition-colors {view ===
			'gallery'
				? 'bg-burgundy text-white'
				: 'border-2 border-burgundy-light text-brown-light hover:border-burgundy hover:text-burgundy'}"
			onclick={() => (view = 'gallery')}
		>
			Gallery
		</button>
		<button
			class="rounded-full px-6 py-2 text-sm font-semibold tracking-widest uppercase transition-colors {view ===
			'upload'
				? 'bg-burgundy text-white'
				: 'border-2 border-burgundy-light text-brown-light hover:border-burgundy hover:text-burgundy'}"
			onclick={() => (view = 'upload')}
		>
			Share Photos
		</button>
	</div>

	{#if view === 'gallery'}
		<!-- Gallery tabs -->
		<div class="mb-8 flex flex-wrap justify-center gap-2">
			{#each tabs as tab}
				<button
					class="rounded-full px-4 py-1.5 text-sm transition-colors {gallery.activeTab === tab.id
						? 'bg-burgundy text-white'
						: 'border border-burgundy-light text-brown-light hover:border-burgundy hover:text-burgundy'}"
					onclick={() => gallery.switchTab(tab.id)}
				>
					{tab.label}
				</button>
			{/each}
		</div>

		<!-- Photo grid for active tab -->
		<PhotoGrid
			photos={gallery.current.photos}
			total={gallery.current.total}
			loading={gallery.current.loading}
			hasMore={gallery.hasMore}
			onLoadMore={() => gallery.loadMore()}
		/>
	{:else}
		<!-- Upload view -->
		<div class="mx-auto max-w-2xl">
			<h2 class="mb-6 text-center font-serif text-2xl text-brown">Share Your Memories</h2>
			<PhotoUpload onUploadComplete={() => { invalidateAll(); view = 'gallery'; gallery.switchTab('guest'); }} />
		</div>
	{/if}
</section>
