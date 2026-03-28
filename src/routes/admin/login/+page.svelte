<script lang="ts">
	import { enhance } from '$app/forms';

	let { form } = $props();
	let loading = $state(false);
</script>

<svelte:head>
	<title>Admin Login</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-gray-50 px-4">
	<div class="w-full max-w-sm">
		<h1 class="mb-8 text-center text-2xl font-semibold text-gray-900">Wedding Admin</h1>

		{#if form?.error}
			<div class="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
				{form.error}
			</div>
		{/if}

		<form
			method="POST"
			use:enhance={() => {
				loading = true;
				return async ({ update }) => {
					loading = false;
					await update();
				};
			}}
			class="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200"
		>
			<label class="mb-4 block">
				<span class="mb-1 block text-sm font-medium text-gray-700">Email</span>
				<input
					type="email"
					name="email"
					required
					class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
				/>
			</label>

			<label class="mb-6 block">
				<span class="mb-1 block text-sm font-medium text-gray-700">Password</span>
				<input
					type="password"
					name="password"
					required
					class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
				/>
			</label>

			<button
				type="submit"
				disabled={loading}
				class="w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
			>
				{loading ? 'Signing in...' : 'Sign In'}
			</button>
		</form>
	</div>
</div>
