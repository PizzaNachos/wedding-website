<script lang="ts">
	import { page } from '$app/state';
	import Toast from '$lib/components/admin/Toast.svelte';

	let { children, data } = $props();

	const isLoginPage = $derived(page.url.pathname === '/admin/login');

	const navLinks = [
		{ href: '/admin', label: 'Dashboard', icon: '~' },
		{ href: '/admin/households', label: 'Households', icon: '~' },
		{ href: '/admin/guests', label: 'Guests', icon: '~' },
		{ href: '/admin/events', label: 'Events', icon: '~' },
		{ href: '/admin/rsvps', label: 'RSVPs', icon: '~' },
		{ href: '/admin/photos', label: 'Photos', icon: '~' }
	];

	function isActive(href: string): boolean {
		if (href === '/admin') return page.url.pathname === '/admin';
		return page.url.pathname.startsWith(href);
	}

	let sidebarOpen = $state(false);
</script>

{#if isLoginPage}
	{@render children()}
{:else}
	<div class="flex min-h-screen bg-gray-50">
		<!-- Sidebar -->
		<aside
			class="fixed inset-y-0 left-0 z-40 w-64 transform bg-gray-900 text-white transition-transform duration-200 md:relative md:translate-x-0 {sidebarOpen ? 'translate-x-0' : '-translate-x-full'}"
		>
			<div class="flex h-16 items-center justify-between border-b border-gray-700 px-6">
				<a href="/admin" class="text-lg font-semibold">Wedding Admin</a>
				<button class="md:hidden" onclick={() => (sidebarOpen = false)} aria-label="Close sidebar">
					<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>
			<nav class="mt-4 space-y-1 px-3">
				{#each navLinks as link}
					<a
						href={link.href}
						class="flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors {isActive(link.href) ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}"
					>
						{link.label}
					</a>
				{/each}
			</nav>
			<div class="absolute bottom-0 w-full border-t border-gray-700 p-4">
				<p class="mb-2 truncate text-xs text-gray-400">{data.user?.email}</p>
				<form action="/admin/logout" method="POST">
					<button
						type="submit"
						class="w-full rounded-lg bg-gray-800 px-3 py-2 text-sm text-gray-300 transition-colors hover:bg-gray-700 hover:text-white"
					>
						Sign Out
					</button>
				</form>
			</div>
		</aside>

		<!-- Sidebar overlay for mobile -->
		{#if sidebarOpen}
			<button
				class="fixed inset-0 z-30 bg-black/50 md:hidden"
				onclick={() => (sidebarOpen = false)}
				aria-label="Close sidebar overlay"
			></button>
		{/if}

		<!-- Main content -->
		<div class="flex flex-1 flex-col">
			<header class="flex h-16 items-center border-b border-gray-200 bg-white px-4 md:px-6">
				<button
					class="mr-4 md:hidden"
					onclick={() => (sidebarOpen = true)}
					aria-label="Open sidebar"
				>
					<svg class="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M4 6h16M4 12h16M4 18h16"
						/>
					</svg>
				</button>
				<a href="/" class="text-sm text-gray-500 hover:text-gray-700" target="_blank">
					View Site &rarr;
				</a>
			</header>
			<main class="flex-1 overflow-auto p-4 md:p-6">
				{@render children()}
			</main>
		</div>
	</div>
	<Toast />
{/if}
