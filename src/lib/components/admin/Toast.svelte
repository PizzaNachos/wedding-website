<script lang="ts">
	import { toasts, removeToast } from '$lib/toast.svelte';
	import { fly, fade } from 'svelte/transition';
</script>

{#if toasts.length > 0}
	<div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
		{#each toasts as toast (toast.id)}
			<div
				role="alert"
				transition:fly={{ x: 100, duration: 300 }}
				class="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium shadow-lg {toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}"
			>
				<span>{toast.message}</span>
				<button
					onclick={() => removeToast(toast.id)}
					class="ml-1 rounded p-0.5 opacity-80 hover:opacity-100"
					aria-label="Dismiss"
				>
					✕
				</button>
			</div>
		{/each}
	</div>
{/if}
