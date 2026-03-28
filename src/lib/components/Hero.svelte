<script lang="ts">
	import { COUPLE, WEDDING_DATE } from '$lib/config';
</script>

<section class="relative flex min-h-screen items-center justify-center bg-burgundy-light/30 px-4">
	<!-- Decorative floral border -->
	<div
		class="pointer-events-none absolute inset-0 border-[16px] border-double border-burgundy/10"
	></div>

	<div class="relative text-center">
		<p class="mb-4 text-sm font-light uppercase tracking-[0.3em] text-brown-light">
			Together with their families
		</p>

		<h1 class="font-script text-6xl leading-tight text-brown sm:text-7xl md:text-8xl">
			{COUPLE.partner1}
			<span class="mx-2 block text-4xl text-burgundy sm:inline sm:text-5xl md:text-6xl">&</span>
			{COUPLE.partner2}
		</h1>

		<div class="mx-auto mt-8 h-px w-24 bg-gold"></div>

		<p class="mt-6 text-sm font-light uppercase tracking-[0.3em] text-brown-light">
			Request the pleasure of your company
		</p>

		<p class="mt-4 font-serif text-2xl text-brown sm:text-3xl">
			{WEDDING_DATE.toLocaleDateString('en-US', {
				weekday: 'long',
				month: 'long',
				day: 'numeric',
				year: 'numeric'
			})}
		</p>

		<div class="mx-auto mt-8 h-px w-24 bg-gold"></div>
	</div>
</section>
