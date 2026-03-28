import { fail, redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { dev } from '$app/environment';
import { createGateToken, validateGateToken, COOKIE_NAME } from '$lib/server/gate';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies }) => {
	const sitePassword = env.SITE_PASSWORD;
	if (!sitePassword) redirect(303, '/');

	const token = cookies.get(COOKIE_NAME);
	if (token && validateGateToken(token, sitePassword)) {
		redirect(303, '/');
	}
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const sitePassword = env.SITE_PASSWORD;
		if (!sitePassword) redirect(303, '/');

		const data = await request.formData();
		const password = data.get('password');

		if (!password || typeof password !== 'string') {
			return fail(401, { error: 'Please enter a password.' });
		}

		const submittedToken = createGateToken(password);
		const expectedToken = createGateToken(sitePassword);

		if (!validateGateToken(submittedToken, sitePassword)) {
			return fail(401, { error: 'Incorrect password. Please try again.' });
		}

		cookies.set(COOKIE_NAME, expectedToken, {
			path: '/',
			maxAge: 60 * 60 * 24 * 30,
			httpOnly: true,
			secure: !dev,
			sameSite: 'lax'
		});

		redirect(303, '/');
	}
};
