<script lang="ts">
	interface Props {
		onIntersect: () => void;
		disabled?: boolean;
		rootMargin?: string;
	}

	let { onIntersect, disabled = false, rootMargin = '600px' }: Props = $props();

	let sentinel: HTMLDivElement;

	$effect(() => {
		if (disabled || !sentinel) return;

		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting) onIntersect();
			},
			{ rootMargin }
		);

		observer.observe(sentinel);
		return () => observer.disconnect();
	});
</script>

<div bind:this={sentinel} aria-hidden="true"></div>
