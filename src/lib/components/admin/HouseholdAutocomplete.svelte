<script lang="ts">
	interface Household {
		id: string;
		name: string;
	}

	let {
		households,
		selectedId = $bindable(''),
		name = 'household_id'
	}: {
		households: Household[];
		selectedId: string;
		name?: string;
	} = $props();

	let searchText = $state('');
	let isOpen = $state(false);
	let highlightedIndex = $state(-1);
	let inputEl: HTMLInputElement;
	let containerEl: HTMLDivElement;

	const filtered = $derived(
		searchText
			? households.filter((h) => h.name.toLowerCase().includes(searchText.toLowerCase()))
			: households
	);

	// Sync display text when selectedId changes externally
	$effect(() => {
		const match = households.find((h) => h.id === selectedId);
		if (match && searchText !== match.name) {
			searchText = match.name;
		}
	});

	function select(household: Household) {
		selectedId = household.id;
		searchText = household.name;
		isOpen = false;
		highlightedIndex = -1;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (!isOpen && e.key === 'ArrowDown') {
			isOpen = true;
			e.preventDefault();
			return;
		}

		if (!isOpen) return;

		if (e.key === 'ArrowDown') {
			e.preventDefault();
			highlightedIndex = Math.min(highlightedIndex + 1, filtered.length - 1);
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			highlightedIndex = Math.max(highlightedIndex - 1, 0);
		} else if (e.key === 'Enter') {
			e.preventDefault();
			if (highlightedIndex >= 0 && filtered[highlightedIndex]) {
				select(filtered[highlightedIndex]);
			}
		} else if (e.key === 'Escape') {
			isOpen = false;
			highlightedIndex = -1;
		}
	}

	function handleInput() {
		isOpen = true;
		highlightedIndex = -1;
		// Clear selection if text no longer matches
		if (selectedId) {
			const match = households.find((h) => h.id === selectedId);
			if (match && match.name !== searchText) {
				selectedId = '';
			}
		}
	}

	function handleFocusOut(e: FocusEvent) {
		// Only close if focus left the entire container
		if (containerEl && !containerEl.contains(e.relatedTarget as Node)) {
			isOpen = false;
			highlightedIndex = -1;
			// Restore text if we have a selection
			if (selectedId) {
				const match = households.find((h) => h.id === selectedId);
				if (match) searchText = match.name;
			}
		}
	}
</script>

<div bind:this={containerEl} class="relative" onfocusout={handleFocusOut}>
	<input type="hidden" {name} value={selectedId} />
	<input
		bind:this={inputEl}
		type="text"
		bind:value={searchText}
		oninput={handleInput}
		onfocus={() => (isOpen = true)}
		onkeydown={handleKeydown}
		placeholder="Search households..."
		autocomplete="off"
		required={!selectedId}
		class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
	/>

	{#if isOpen && filtered.length > 0}
		<ul
			class="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg"
			role="listbox"
		>
			{#each filtered as household, i}
				<li role="option" aria-selected={i === highlightedIndex}>
					<button
						type="button"
						class="w-full px-3 py-2 text-left text-sm {i === highlightedIndex ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-50'} {household.id === selectedId ? 'font-medium' : ''}"
						onmousedown={(e) => { e.preventDefault(); select(household); }}
					>
						{household.name}
					</button>
				</li>
			{/each}
		</ul>
	{/if}

	{#if isOpen && searchText && filtered.length === 0}
		<div class="absolute z-20 mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-400 shadow-lg">
			No households found
		</div>
	{/if}
</div>
