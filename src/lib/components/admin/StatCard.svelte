<script lang="ts">
	interface Props {
		label: string;
		value: string | number;
		sublabel?: string;
	}

	let { label, value, sublabel }: Props = $props();
</script>

<div class="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
	<p class="text-sm font-medium text-gray-500">{label}</p>
	<p class="mt-1 text-3xl font-semibold text-gray-900">{value}</p>
	{#if sublabel}
		<p class="mt-1 text-xs text-gray-400">{sublabel}</p>
	{/if}
</div>
