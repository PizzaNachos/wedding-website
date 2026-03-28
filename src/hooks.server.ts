import { createServerClient } from '@supabase/ssr';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { env } from '$env/dynamic/private';
import { redirect, type Handle } from '@sveltejs/kit';
import { validateGateToken, COOKIE_NAME } from '$lib/server/gate';

export const handle: Handle = async ({ event, resolve }) => {
	const supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
		cookies: {
			getAll: () => event.cookies.getAll(),
			setAll: (cookiesToSet) => {
				cookiesToSet.forEach(({ name, value, options }) => {
					event.cookies.set(name, value, { ...options, path: '/' });
				});
			}
		}
	});

	const {
		data: { user }
	} = await supabase.auth.getUser();

	event.locals.supabase = supabase;
	event.locals.user = user;

	// Global site password gate
	const sitePassword = env.SITE_PASSWORD;
	if (sitePassword) {
		const { pathname } = event.url;

		// Allow the gate page itself through
		if (pathname !== '/gate') {
			const token = event.cookies.get(COOKIE_NAME);
			const authenticated = token && validateGateToken(token, sitePassword);

			if (!authenticated) {
				// API routes get a 401 JSON response instead of a redirect
				if (pathname.startsWith('/api/')) {
					return new Response(JSON.stringify({ error: 'Unauthorized' }), {
						status: 401,
						headers: { 'Content-Type': 'application/json' }
					});
				}
				redirect(303, '/gate');
			}
		}
	}

	return resolve(event, {
		filterSerializedResponseHeaders(name) {
			return name === 'content-range' || name === 'x-supabase-api-version';
		}
	});
};
