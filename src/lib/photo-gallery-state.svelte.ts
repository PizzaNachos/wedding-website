import { tick } from 'svelte';
import { PAGE_SIZE, type Photo, type TabId } from '$lib/photo-types';

interface TabState {
	photos: Photo[];
	total: number;
	offset: number;
	loading: boolean;
	scrollY: number;
}

function createTabState(photos: Photo[], total: number): TabState {
	return {
		photos,
		total,
		offset: photos.length,
		loading: false,
		scrollY: 0
	};
}

export class PhotoGalleryState {
	tabs = $state<Record<TabId, TabState>>({
		engagement: createTabState([], 0),
		ceremony: createTabState([], 0),
		reception: createTabState([], 0),
		guest: createTabState([], 0)
	});

	activeTab = $state<TabId>('engagement');

	current = $derived(this.tabs[this.activeTab]);
	hasMore = $derived(this.tabs[this.activeTab].offset < this.tabs[this.activeTab].total);

	private abortController: AbortController | null = null;

	init(data: Record<TabId, { photos: Photo[]; total: number }>) {
		for (const tab of ['engagement', 'ceremony', 'reception', 'guest'] as TabId[]) {
			this.tabs[tab] = createTabState(data[tab].photos, data[tab].total);
		}
	}

	async loadMore() {
		const tab = this.activeTab;
		const state = this.tabs[tab];

		if (state.loading || state.offset >= state.total) return;

		this.abortController?.abort();
		const controller = new AbortController();
		this.abortController = controller;

		state.loading = true;

		try {
			const params = new URLSearchParams({
				tab,
				offset: String(state.offset),
				limit: String(PAGE_SIZE)
			});

			const res = await fetch(`/api/photos/gallery?${params}`, {
				signal: controller.signal
			});

			if (!res.ok) throw new Error('Failed to fetch');

			const { photos, total } = await res.json();

			// Verify tab hasn't changed during fetch
			if (this.activeTab !== tab) return;

			state.photos = [...state.photos, ...photos];
			state.total = total;
			state.offset = state.photos.length;
		} catch (e) {
			if (e instanceof DOMException && e.name === 'AbortError') return;
			console.error('Failed to load more photos:', e);
		} finally {
			state.loading = false;
		}
	}

	async switchTab(newTab: TabId) {
		if (newTab === this.activeTab) return;

		// Save current scroll position
		if (typeof window !== 'undefined') {
			this.tabs[this.activeTab].scrollY = window.scrollY;
		}

		this.activeTab = newTab;

		// Restore scroll position after DOM update
		if (typeof window !== 'undefined') {
			const savedY = this.tabs[newTab].scrollY;
			await tick();
			window.scrollTo(0, savedY);
		}
	}

	resetTab(tab: TabId, photos: Photo[], total: number) {
		this.tabs[tab] = createTabState(photos, total);
	}
}
