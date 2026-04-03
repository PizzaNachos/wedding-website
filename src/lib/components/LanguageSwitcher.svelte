<script lang="ts">
	import { i18n, type Locale } from '$lib/i18n.svelte';

	function selectLocale(locale: Locale) {
		if (i18n.locale !== locale) {
			i18n.setLocale(locale);
		}
	}

	function optionClasses(locale: Locale) {
		const active = i18n.locale === locale;
		return `touch-target inline-flex items-center justify-center rounded-full p-1.5 ${
			active
				? 'bg-burgundy shadow-[0_6px_18px_rgba(114,47,55,0.28)]'
				: 'border border-transparent bg-ivory/85 hover:border-burgundy/20 hover:text-burgundy-dark'
		}`;
	}
</script>

<div
	class="flex items-center gap-2 rounded-full border border-burgundy/15 bg-burgundy/[0.04] p-1 shadow-[0_10px_30px_rgba(114,47,55,0.08)]"
	role="group"
	aria-label={i18n.t.nav.languageSwitcher}
>
	<button
		type="button"
		class={optionClasses('en')}
		aria-label={i18n.t.nav.switchToEnglish}
		aria-pressed={i18n.locale === 'en'}
		onclick={() => selectLocale('en')}
	>
		<span class="overflow-hidden rounded-full ring-1 ring-black/8 h-5 w-5">
			<svg viewBox="0 0 64 64" aria-hidden="true" class="h-full w-full">
				<rect width="64" height="64" fill="#ffffff" />
				<rect y="0" width="64" height="4.93" fill="#b22234" />
				<rect y="9.86" width="64" height="4.93" fill="#b22234" />
				<rect y="19.72" width="64" height="4.93" fill="#b22234" />
				<rect y="29.58" width="64" height="4.93" fill="#b22234" />
				<rect y="39.44" width="64" height="4.93" fill="#b22234" />
				<rect y="49.3" width="64" height="4.93" fill="#b22234" />
				<rect y="59.16" width="64" height="4.84" fill="#b22234" />
				<rect width="28" height="34.5" fill="#3c3b6e" />
				<g fill="#ffffff">
					<circle cx="4" cy="4.5" r="1.15" />
					<circle cx="10" cy="4.5" r="1.15" />
					<circle cx="16" cy="4.5" r="1.15" />
					<circle cx="22" cy="4.5" r="1.15" />
					<circle cx="7" cy="9.5" r="1.15" />
					<circle cx="13" cy="9.5" r="1.15" />
					<circle cx="19" cy="9.5" r="1.15" />
					<circle cx="25" cy="9.5" r="1.15" />
					<circle cx="4" cy="14.5" r="1.15" />
					<circle cx="10" cy="14.5" r="1.15" />
					<circle cx="16" cy="14.5" r="1.15" />
					<circle cx="22" cy="14.5" r="1.15" />
					<circle cx="7" cy="19.5" r="1.15" />
					<circle cx="13" cy="19.5" r="1.15" />
					<circle cx="19" cy="19.5" r="1.15" />
					<circle cx="25" cy="19.5" r="1.15" />
					<circle cx="4" cy="24.5" r="1.15" />
					<circle cx="10" cy="24.5" r="1.15" />
					<circle cx="16" cy="24.5" r="1.15" />
					<circle cx="22" cy="24.5" r="1.15" />
					<circle cx="7" cy="29.5" r="1.15" />
					<circle cx="13" cy="29.5" r="1.15" />
					<circle cx="19" cy="29.5" r="1.15" />
					<circle cx="25" cy="29.5" r="1.15" />
				</g>
			</svg>
		</span>
	</button>

	<button
		type="button"
		class={optionClasses('es')}
		aria-label={i18n.t.nav.switchToSpanish}
		aria-pressed={i18n.locale === 'es'}
		onclick={() => selectLocale('es')}
	>
		<span class="overflow-hidden rounded-full ring-1 ring-black/8 h-5 w-5">
			<svg viewBox="0 0 64 64" aria-hidden="true" class="h-full w-full">
				<rect width="21.34" height="64" x="0" fill="#006847" />
				<rect width="21.33" height="64" x="21.34" fill="#ffffff" />
				<rect width="21.33" height="64" x="42.67" fill="#ce1126" />
				<circle cx="32" cy="32" r="6.5" fill="#b58a3a" />
				<circle cx="32" cy="32" r="3.25" fill="#7a5a1a" />
			</svg>
		</span>
	</button>
</div>
