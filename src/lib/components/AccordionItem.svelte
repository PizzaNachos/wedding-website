<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		title: string;
		children: Snippet;
	}

	let { title, children }: Props = $props();
	let isOpen = $state(false);
</script>

<div class="rounded-lg border border-burgundy-light bg-white shadow-sm">
	<button
		class="flex w-full cursor-pointer items-center justify-between px-6 py-4 text-left"
		onclick={() => (isOpen = !isOpen)}
		aria-expanded={isOpen}
	>
		<span class="font-serif text-lg text-brown">{title}</span>
		<svg
			class="h-5 w-5 shrink-0 text-burgundy transition-transform duration-200 {isOpen
				? 'rotate-180'
				: ''}"
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
			stroke-width="2"
		>
			<path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
		</svg>
	</button>
	<div
		class="grid transition-all duration-200 {isOpen
			? 'grid-rows-[1fr] opacity-100'
			: 'grid-rows-[0fr] opacity-0'}"
	>
		<div class="overflow-hidden">
			<div class="px-6 pb-4 text-brown-light">
				{@render children()}
			</div>
		</div>
	</div>
</div>
