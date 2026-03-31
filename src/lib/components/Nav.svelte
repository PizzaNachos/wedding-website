<script lang="ts">
	import { page } from '$app/state';
	import { guestSession } from '$lib/guest-session.svelte';
	import { i18n } from '$lib/i18n.svelte';

	const linkKeys = ['home', 'ourStory', 'lodging', 'faqs', 'photos', 'registry', 'rsvp'] as const;
	const linkHrefs: Record<(typeof linkKeys)[number], string> = {
		home: '/',
		ourStory: '/our-story',
		lodging: '/lodging',
		faqs: '/faqs',
		photos: '/photos',
		registry: '/registry',
		rsvp: '/rsvp'
	};

	let menuOpen = $state(false);

	function isActive(href: string): boolean {
		if (href === '/') return page.url.pathname === '/';
		return page.url.pathname.startsWith(href);
	}
</script>

<nav class="sticky top-0 z-50 border-b border-burgundy-light bg-ivory/95 backdrop-blur-sm">
	<div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
		<a href="/" class="font-script text-2xl text-burgundy-dark hover:text-burgundy transition-colors">
			{i18n.t.nav.title}
		</a>

		<!-- Desktop nav -->
		<ul class="hidden items-center gap-6 md:flex">
			{#each linkKeys as key}
				<li>
					<a
						href={linkHrefs[key]}
						class="text-sm font-light uppercase tracking-widest transition-colors {isActive(linkHrefs[key])
							? 'text-burgundy-dark border-b-2 border-burgundy pb-1'
							: 'text-brown-light hover:text-burgundy-dark'}"
					>
						{i18n.t.nav[key]}
					</a>
				</li>
			{/each}
		</ul>

		<div class="hidden items-center gap-4 md:flex">
			<!-- Language toggle -->
			<button
				type="button"
				onclick={() => i18n.toggle()}
				class="text-xs font-light uppercase tracking-widest text-brown-light hover:text-burgundy-dark transition-colors"
				aria-label="Toggle language"
			>
				<span class={i18n.locale === 'en' ? 'text-burgundy-dark font-semibold' : ''}>EN</span>
				<span class="mx-1 opacity-40">|</span>
				<span class={i18n.locale === 'es' ? 'text-burgundy-dark font-semibold' : ''}>ES</span>
			</button>

			{#if guestSession.current}
				<span class="flex items-center gap-1 text-xs text-brown-light">
					{guestSession.current.first_name}
					<button
						type="button"
						onclick={() => guestSession.clear()}
						class="text-burgundy/60 underline hover:text-burgundy"
					>
						{i18n.t.nav.notYou}
					</button>
				</span>
			{/if}
		</div>

		<!-- Mobile hamburger -->
		<button
			class="flex flex-col gap-1.5 md:hidden"
			onclick={() => (menuOpen = !menuOpen)}
			aria-label="Toggle menu"
			aria-expanded={menuOpen}
		>
			<span
				class="block h-0.5 w-6 bg-brown transition-transform {menuOpen
					? 'translate-y-2 rotate-45'
					: ''}"
			></span>
			<span class="block h-0.5 w-6 bg-brown transition-opacity {menuOpen ? 'opacity-0' : ''}">
			</span>
			<span
				class="block h-0.5 w-6 bg-brown transition-transform {menuOpen
					? '-translate-y-2 -rotate-45'
					: ''}"
			></span>
		</button>
	</div>

	<!-- Mobile menu -->
	{#if menuOpen}
		<div class="border-t border-burgundy-light bg-ivory md:hidden">
			<ul class="flex flex-col px-4 py-2">
				{#each linkKeys as key}
					<li>
						<a
							href={linkHrefs[key]}
							class="block py-3 text-sm font-light uppercase tracking-widest transition-colors {isActive(
								linkHrefs[key]
							)
								? 'text-burgundy-dark'
								: 'text-brown-light hover:text-burgundy-dark'}"
							onclick={() => (menuOpen = false)}
						>
							{i18n.t.nav[key]}
						</a>
					</li>
				{/each}
			</ul>
			<div class="border-t border-burgundy-light px-4 py-3 flex items-center justify-between">
				<!-- Language toggle (mobile) -->
				<button
					type="button"
					onclick={() => i18n.toggle()}
					class="text-xs font-light uppercase tracking-widest text-brown-light hover:text-burgundy-dark transition-colors"
					aria-label="Toggle language"
				>
					<span class={i18n.locale === 'en' ? 'text-burgundy-dark font-semibold' : ''}>EN</span>
					<span class="mx-1 opacity-40">|</span>
					<span class={i18n.locale === 'es' ? 'text-burgundy-dark font-semibold' : ''}>ES</span>
				</button>

				{#if guestSession.current}
					<span class="text-xs text-brown-light">
						{guestSession.current.first_name}
						<button
							type="button"
							onclick={() => { guestSession.clear(); menuOpen = false; }}
							class="ml-1 underline hover:text-brown"
						>
							{i18n.t.nav.notYou}
						</button>
					</span>
				{/if}
			</div>
		</div>
	{/if}
</nav>
