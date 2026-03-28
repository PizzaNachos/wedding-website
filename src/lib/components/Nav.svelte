<script lang="ts">
	import { page } from '$app/state';
	import { guestSession } from '$lib/guest-session.svelte';

	const links = [
		{ href: '/', label: 'Home' },
		{ href: '/lodging', label: 'Lodging' },
		{ href: '/faqs', label: 'FAQs' },
		{ href: '/photos', label: 'Photos' },
		{ href: '/registry', label: 'Registry' },
		{ href: '/rsvp', label: 'RSVP' }
	];

	let menuOpen = $state(false);

	function isActive(href: string): boolean {
		if (href === '/') return page.url.pathname === '/';
		return page.url.pathname.startsWith(href);
	}
</script>

<nav class="sticky top-0 z-50 border-b border-burgundy-light bg-ivory/95 backdrop-blur-sm">
	<div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
		<a href="/" class="font-script text-2xl text-burgundy-dark hover:text-burgundy transition-colors">
			Our Wedding
		</a>

		<!-- Desktop nav -->
		<ul class="hidden items-center gap-6 md:flex">
			{#each links as link}
				<li>
					<a
						href={link.href}
						class="text-sm font-light uppercase tracking-widest transition-colors {isActive(link.href)
							? 'text-burgundy-dark border-b-2 border-burgundy pb-1'
							: 'text-brown-light hover:text-burgundy-dark'}"
					>
						{link.label}
					</a>
				</li>
			{/each}
		</ul>

		{#if guestSession.current}
			<span class="hidden items-center gap-1 text-xs text-brown-light md:flex">
				{guestSession.current.first_name}
				<button
					type="button"
					onclick={() => guestSession.clear()}
					class="text-burgundy/60 underline hover:text-burgundy"
				>
					Not you?
				</button>
			</span>
		{/if}

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
				{#each links as link}
					<li>
						<a
							href={link.href}
							class="block py-3 text-sm font-light uppercase tracking-widest transition-colors {isActive(
								link.href
							)
								? 'text-burgundy-dark'
								: 'text-brown-light hover:text-burgundy-dark'}"
							onclick={() => (menuOpen = false)}
						>
							{link.label}
						</a>
					</li>
				{/each}
			</ul>
			{#if guestSession.current}
				<div class="border-t border-burgundy-light px-4 py-3 text-xs text-brown-light">
					{guestSession.current.first_name}
					<button
						type="button"
						onclick={() => { guestSession.clear(); menuOpen = false; }}
						class="ml-1 underline hover:text-brown"
					>
						Not you?
					</button>
				</div>
			{/if}
		</div>
	{/if}
</nav>
