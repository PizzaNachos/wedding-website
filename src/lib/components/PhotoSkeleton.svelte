<script lang="ts">
	interface Props {
		count?: number;
	}

	let { count = 8 }: Props = $props();

	const heights = $derived(
		Array.from(
			{ length: count },
			() => [150, 200, 250, 180, 220][Math.floor(Math.random() * 5)]
		)
	);
</script>

{#each heights as h}
	<div class="mb-3 animate-pulse rounded-lg bg-brown-light/20" style="height: {h}px"></div>
{/each}
