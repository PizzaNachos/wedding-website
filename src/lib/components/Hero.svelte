<script lang="ts">
	import { COUPLE, WEDDING_DATE } from '$lib/config';
	import { i18n } from '$lib/i18n.svelte';
</script>

<section
	class="relative flex min-h-[72svh] items-center justify-center bg-burgundy-light/30 px-4 py-10 sm:min-h-screen"
>
	<!-- Decorative floral border -->
	<div
		class="compact-frame pointer-events-none absolute inset-0 border-double border-burgundy/10"
	></div>

	<div class="page-shell page-shell--md relative text-center">
		<p
			class="mb-4 text-[0.68rem] font-light tracking-[0.22em] text-brown-light uppercase sm:text-sm sm:tracking-[0.3em]"
		>
			{i18n.t.hero.together}
		</p>

		<h1
			class="font-script text-5xl leading-[0.92] text-brown min-[380px]:text-6xl sm:text-7xl md:text-8xl"
		>
			{COUPLE.partner1}
			<span class="mx-2 block text-3xl text-burgundy sm:inline sm:text-5xl md:text-6xl">&</span>
			{COUPLE.partner2}
		</h1>

		<div class="mx-auto mt-6 h-px w-20 bg-gold sm:mt-8 sm:w-24"></div>

		<p
			class="mt-5 text-[0.68rem] font-light tracking-[0.22em] text-brown-light uppercase sm:mt-6 sm:text-sm sm:tracking-[0.3em]"
		>
			{i18n.t.hero.pleasure}
		</p>

		<p class="mt-4 font-serif text-xl leading-snug text-brown sm:text-3xl">
			{WEDDING_DATE.toLocaleDateString(i18n.locale === 'es' ? 'es-ES' : 'en-US', {
				weekday: 'long',
				month: 'long',
				day: 'numeric',
				year: 'numeric'
			})}
		</p>

		<div class="mx-auto mt-6 h-px w-20 bg-gold sm:mt-8 sm:w-24"></div>
	</div>
</section>
