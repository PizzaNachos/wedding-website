import { createServiceClient } from '$lib/supabase-server';
import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async () => {
	const supabase = createServiceClient();

	const { data: events } = await supabase
		.from('events')
		.select('*')
		.order('date', { ascending: true });

	return { events: events ?? [] };
};

export const actions: Actions = {
	create: async ({ request }) => {
		const supabase = createServiceClient();
		const formData = await request.formData();

		const name = formData.get('name') as string;
		const date = formData.get('date') as string;
		const time = formData.get('time') as string;
		const location = (formData.get('location') as string) || null;
		const description = (formData.get('description') as string) || null;

		if (!name || !date || !time) {
			return fail(400, { error: 'Name, date, and time are required.' });
		}

		const { error } = await supabase.from('events').insert({ name, date, time, location, description });

		if (error) {
			return fail(500, { error: 'Failed to create event.' });
		}

		return { success: true };
	},

	update: async ({ request }) => {
		const supabase = createServiceClient();
		const formData = await request.formData();

		const id = formData.get('id') as string;
		const name = formData.get('name') as string;
		const date = formData.get('date') as string;
		const time = formData.get('time') as string;
		const location = (formData.get('location') as string) || null;
		const description = (formData.get('description') as string) || null;

		if (!id || !name || !date || !time) {
			return fail(400, { error: 'Name, date, and time are required.' });
		}

		const { error } = await supabase
			.from('events')
			.update({ name, date, time, location, description })
			.eq('id', id);

		if (error) {
			return fail(500, { error: 'Failed to update event.' });
		}

		return { success: true };
	},

	delete: async ({ request }) => {
		const supabase = createServiceClient();
		const formData = await request.formData();
		const id = formData.get('id') as string;

		if (!id) return fail(400, { error: 'Event ID is required.' });

		// Delete related guest_events and rsvps first
		await supabase.from('rsvps').delete().eq('event_id', id);
		await supabase.from('guest_events').delete().eq('event_id', id);

		const { error } = await supabase.from('events').delete().eq('id', id);

		if (error) {
			return fail(500, { error: 'Failed to delete event.' });
		}

		return { success: true };
	}
};
