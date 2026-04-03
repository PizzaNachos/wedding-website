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

<div class="flex min-h-svh items-center justify-center bg-ivory px-4 py-8">
	<div class="relative w-full max-w-lg py-10 sm:py-16">
		<!-- Decorative border -->
		<div
			class="compact-frame pointer-events-none absolute inset-0 border-double border-burgundy/10"
		></div>

		<div class="page-shell relative text-center">
			<p
				class="mb-4 text-[0.68rem] font-light tracking-[0.22em] text-brown-light uppercase sm:text-sm sm:tracking-[0.3em]"
			>
				Together with their families
			</p>

			<h1 class="font-script text-4xl leading-[0.95] text-brown min-[380px]:text-5xl sm:text-6xl">
				{COUPLE.partner1.split(' ')[0]}
				<span class="mx-2 block text-2xl text-burgundy sm:inline sm:text-4xl">&</span>
				{COUPLE.partner2.split(' ')[0]}
			</h1>

			<div class="mx-auto mt-6 h-px w-20 bg-gold sm:mt-8 sm:w-24"></div>

			<p class="mt-6 font-serif text-sm leading-relaxed text-brown-light sm:mt-8">
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
				class="mx-auto mt-6 w-full max-w-xs"
			>
				<input
					type="password"
					name="password"
					required
					placeholder="Enter password"
					class="touch-target w-full rounded-lg border border-burgundy/30 bg-white px-4 py-3 text-center text-sm text-brown focus:border-burgundy focus:ring-1 focus:ring-burgundy focus:outline-none"
				/>

				<button
					type="submit"
					disabled={loading}
					class="touch-target mt-4 w-full rounded-lg bg-burgundy px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-burgundy-dark disabled:opacity-50"
				>
					{loading ? 'Entering...' : 'Enter'}
				</button>
			</form>
		</div>
	</div>
</div>
