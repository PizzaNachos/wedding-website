import { createServiceClient } from '$lib/supabase-server';
import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async () => {
	const supabase = createServiceClient();

	const { data: households } = await supabase
		.from('households')
		.select('id, name')
		.order('name', { ascending: true });

	return {
		households: households ?? []
	};
};

export const actions: Actions = {
	default: async ({ request }) => {
		const supabase = createServiceClient();
		const formData = await request.formData();

		const first_name = (formData.get('first_name') as string)?.trim();
		const last_name = (formData.get('last_name') as string)?.trim();
		const household_id = formData.get('household_id') as string;
		const is_child = formData.get('is_child') === 'on';

		if (!first_name || !last_name || !household_id) {
			return fail(400, { error: 'First name, last name, and household are required.' });
		}

		const { error: guestError } = await supabase
			.from('guests')
			.insert({ first_name, last_name, household_id, is_child })
			.select('id')
			.single();

		if (guestError) {
			return fail(500, { error: 'Failed to create guest.' });
		}

		return { success: true };
	}
};
