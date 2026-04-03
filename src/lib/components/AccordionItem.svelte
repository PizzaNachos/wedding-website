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
		class="touch-target flex w-full cursor-pointer items-start justify-between gap-4 px-4 py-4 text-left sm:px-6"
		onclick={() => (isOpen = !isOpen)}
		aria-expanded={isOpen}
	>
		<span class="font-serif text-base leading-relaxed text-brown sm:text-lg">{title}</span>
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
			<div class="px-4 pb-4 text-brown-light sm:px-6">
				{@render children()}
			</div>
		</div>
	</div>
</div>
