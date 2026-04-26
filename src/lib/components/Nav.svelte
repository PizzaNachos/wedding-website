<script lang="ts">
	import { page } from '$app/state';
	import LanguageSwitcher from '$lib/components/LanguageSwitcher.svelte';
	import { guestSession } from '$lib/guest-session.svelte';
	import { i18n } from '$lib/i18n.svelte';

	const linkKeys = [
		'home',
		'ourStory',
		'lodging',
		'faqs',
		'photos',
		'sharePhotos',
		'music',
		'registry',
		'rsvp'
	] as const;
	const linkHrefs: Record<(typeof linkKeys)[number], string> = {
		home: '/',
		ourStory: '/our-story',
		lodging: '/lodging',
		faqs: '/faqs',
		photos: '/photos',
		sharePhotos: '/photos?upload=1',
		music: '/music',
		registry: '/registry',
		rsvp: '/rsvp'
	};

	let menuOpen = $state(false);

	function isActive(href: string): boolean {
		if (href === '/') return page.url.pathname === '/';
		const [hrefPath, hrefQuery] = href.split('?');
		if (hrefQuery) {
			return page.url.pathname === hrefPath && page.url.search === `?${hrefQuery}`;
		}
		if (!page.url.pathname.startsWith(hrefPath)) return false;
		// Defer to a more-specific sibling link if one matches the current URL exactly.
		const matchedBySibling = Object.values(linkHrefs).some((other) => {
			if (other === href) return false;
			const [otherPath, otherQuery] = other.split('?');
			if (!otherQuery) return false;
			return otherPath === page.url.pathname && page.url.search === `?${otherQuery}`;
		});
		return !matchedBySibling;
	}
</script>

<nav class="sticky top-0 z-50 border-b border-burgundy-light bg-ivory/95 backdrop-blur-sm">
	<div class="page-shell page-shell--xl">
		<!-- Row 1: Logo + Mobile hamburger -->
		<div class="flex items-center justify-between gap-3 py-3">
			<a
				href="/"
				class="font-script text-[1.55rem] leading-none text-burgundy-dark transition-colors hover:text-burgundy sm:text-2xl"
			>
				{i18n.t.nav.title}
			</a>

			<div class="flex shrink-0 items-center gap-2 md:hidden">
				<LanguageSwitcher />

				<!-- Mobile hamburger -->
				<button
					class="touch-target flex shrink-0 flex-col items-center justify-center gap-1.5 rounded-full text-brown"
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
		</div>

		<!-- Row 2: Desktop nav (wrapping) -->
		<div class="hidden flex-wrap items-center gap-4 pb-3 md:flex lg:gap-6">
			{#each linkKeys as key}
				<a
					href={linkHrefs[key]}
					class="whitespace-nowrap py-1 text-xs font-light tracking-[0.22em] uppercase transition-colors lg:text-sm {isActive(
						linkHrefs[key]
					)
						? 'border-b-2 border-burgundy pb-1 text-burgundy-dark'
						: 'text-brown-light hover:text-burgundy-dark'}"
				>
					{i18n.t.nav[key]}
				</a>
			{/each}

			<LanguageSwitcher />

			{#if guestSession.current}
				<span class="flex items-center gap-1 text-xs text-brown-light">
					{guestSession.current.first_name}
					<button
						type="button"
						onclick={() => guestSession.clear()}
						class="touch-target px-1 text-burgundy/60 underline hover:text-burgundy"
					>
						{i18n.t.nav.notYou}
					</button>
				</span>
			{/if}
		</div>
	</div>

	<!-- Mobile menu -->
	{#if menuOpen}
		<div class="border-t border-burgundy-light bg-ivory md:hidden">
			<ul class="page-shell flex flex-col py-2">
				{#each linkKeys as key}
					<li>
						<a
							href={linkHrefs[key]}
							class="touch-target flex items-center py-3 text-sm font-light tracking-[0.22em] uppercase transition-colors {isActive(
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
			<div
				class="page-shell flex flex-col gap-3 border-t border-burgundy-light py-3 sm:flex-row sm:items-center sm:justify-between"
			>
				{#if guestSession.current}
					<span class="flex flex-wrap items-center gap-1 text-xs text-brown-light">
						{guestSession.current.first_name}
						<button
							type="button"
							onclick={() => {
								guestSession.clear();
								menuOpen = false;
							}}
							class="touch-target px-1 underline hover:text-brown"
						>
							{i18n.t.nav.notYou}
						</button>
					</span>
				{/if}
			</div>
		</div>
	{/if}
</nav>
