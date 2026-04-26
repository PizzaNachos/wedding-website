<script lang="ts">
	import { COUPLE, SONG_REQUEST_URL } from '$lib/config';
	import { i18n } from '$lib/i18n.svelte';
</script>

<svelte:head>
	<title>{i18n.t.music.title} — {COUPLE.partner1} & {COUPLE.partner2}</title>
</svelte:head>

<section class="page-shell page-shell--lg page-section">
	<div class="mb-10 text-center">
		<h1 class="page-title font-script text-brown">{i18n.t.music.title}</h1>
		<div class="section-rule"></div>
		<p class="mx-auto mt-4 max-w-2xl leading-relaxed text-brown-light">
			{i18n.t.music.subtitle}
		</p>
	</div>

	<div class="mx-auto max-w-2xl text-center">
		<p class="mb-8 leading-relaxed text-brown-light">
			{i18n.t.music.instructions}
		</p>

		<a
			href={SONG_REQUEST_URL}
			target="_blank"
			rel="noopener noreferrer"
			class="touch-target inline-flex items-center justify-center rounded-full bg-brown px-8 py-3 text-sm font-semibold tracking-[0.22em] text-white uppercase transition-opacity hover:opacity-90"
		>
			{i18n.t.music.cta}
		</a>
	</div>
</section>
