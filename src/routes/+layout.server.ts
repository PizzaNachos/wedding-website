import { env } from '$env/dynamic/private';
import { validateGateToken, COOKIE_NAME } from '$lib/server/gate';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ cookies }) => {
	const sitePassword = env.SITE_PASSWORD;
	if (!sitePassword) return { gateAuthenticated: true };

	const token = cookies.get(COOKIE_NAME);
	const gateAuthenticated = !!token && validateGateToken(token, sitePassword);

	return { gateAuthenticated };
};
