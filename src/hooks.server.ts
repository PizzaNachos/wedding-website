import { createServerClient } from '@supabase/ssr';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import { redirect, type Handle } from '@sveltejs/kit';
import { validateGateToken, COOKIE_NAME } from '$lib/server/gate';

const RSVP_VISITOR_COOKIE = 'rsvp_visitor_id';
const RSVP_VISITOR_MAX_AGE = 60 * 60 * 24 * 365;

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

	let visitorId = event.cookies.get(RSVP_VISITOR_COOKIE);
	if (
		!visitorId ||
		!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(visitorId)
	) {
		visitorId = crypto.randomUUID();
		event.cookies.set(RSVP_VISITOR_COOKIE, visitorId, {
			httpOnly: true,
			sameSite: 'lax',
			path: '/',
			secure: !dev,
			maxAge: RSVP_VISITOR_MAX_AGE
		});
	}
	event.locals.visitorId = visitorId;

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
