import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	if (url.pathname === '/admin/login') {
		return { user: locals.user };
	}

	if (!locals.user) {
		throw redirect(303, '/admin/login');
	}

	return { user: locals.user };
};
