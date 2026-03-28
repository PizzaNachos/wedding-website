<script lang="ts">
	import '../layout.css';
	import favicon from '$lib/assets/favicon.jpg';
	import { enhance } from '$app/forms';
	import { COUPLE } from '$lib/config';

	let { form } = $props();
	let loading = $state(false);
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>{COUPLE.partner1} & {COUPLE.partner2}</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-ivory px-4">
	<div class="relative w-full max-w-xl py-16">
		<!-- Decorative border -->
		<div
			class="pointer-events-none absolute inset-0 border-[16px] border-double border-burgundy/10"
		></div>

		<div class="relative text-center">
			<p class="mb-4 text-sm font-light tracking-[0.3em] text-brown-light uppercase">
				Together with their families
			</p>

			<h1 class="font-script text-5xl leading-tight whitespace-nowrap text-brown sm:text-6xl">
				{COUPLE.partner1.split(' ')[0]}
				<span class="mx-2 text-3xl text-burgundy sm:text-4xl">&</span>
				{COUPLE.partner2.split(' ')[0]}
			</h1>

			<div class="mx-auto mt-8 h-px w-24 bg-gold"></div>

			<p class="mt-8 font-serif text-sm text-brown-light">
				Please enter the password from your invitation
			</p>

			{#if form?.error}
				<div class="mx-auto mt-4 max-w-xs rounded-lg bg-red-50 p-3 text-sm text-red-700">
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
				class="mx-auto mt-6 max-w-xs"
			>
				<input
					type="password"
					name="password"
					required
					placeholder="Enter password"
					class="w-full rounded-lg border border-burgundy/30 bg-white px-4 py-2.5 text-center text-sm text-brown focus:border-burgundy focus:ring-1 focus:ring-burgundy focus:outline-none"
				/>

				<button
					type="submit"
					disabled={loading}
					class="mt-4 w-full rounded-lg bg-burgundy px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-burgundy-dark disabled:opacity-50"
				>
					{loading ? 'Entering...' : 'Enter'}
				</button>
			</form>
		</div>
	</div>
</div>
