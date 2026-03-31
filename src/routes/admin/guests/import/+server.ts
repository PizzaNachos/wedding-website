import { createServiceClient } from '$lib/supabase-server';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const REQUIRED_HEADERS = ['household_name', 'first_name', 'last_name'];
const CONTACT_FIELDS = ['email', 'phone', 'address_street', 'address_city', 'address_state', 'address_country', 'address_postal_code'];

function parseBoolean(value: string): boolean {
	const v = value.trim().toLowerCase();
	return v === 'true' || v === 'yes' || v === '1';
}

function generateCode(): string {
	return crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase();
}

function parseCSV(text: string): { headers: string[]; rows: Record<string, string>[] } {
	const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter((l) => l.trim());
	if (lines.length < 2) return { headers: [], rows: [] };

	const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
	const rows: Record<string, string>[] = [];

	for (let i = 1; i < lines.length; i++) {
		const values = lines[i].split(',').map((v) => v.trim());
		const row: Record<string, string> = {};
		headers.forEach((h, idx) => {
			row[h] = values[idx] ?? '';
		});
		rows.push(row);
	}

	return { headers, rows };
}

export const POST: RequestHandler = async ({ request }) => {
	const supabase = createServiceClient();

	const formData = await request.formData();
	const file = formData.get('file') as File | null;

	if (!file) {
		return json({ error: 'No file provided.' }, { status: 400 });
	}

	const text = await file.text();
	const { headers, rows } = parseCSV(text);

	// Validate required headers
	const missingHeaders = REQUIRED_HEADERS.filter((h) => !headers.includes(h));
	if (missingHeaders.length > 0) {
		return json({ error: `Missing required columns: ${missingHeaders.join(', ')}` }, { status: 400 });
	}

	// Group rows by household_name (case-insensitive, trimmed)
	const householdMap = new Map<string, { key: string; rows: (typeof rows[0])[] }>();
	for (const row of rows) {
		const key = row['household_name'].trim().toLowerCase();
		if (!key) continue;
		if (!householdMap.has(key)) {
			householdMap.set(key, { key, rows: [] });
		}
		householdMap.get(key)!.rows.push(row);
	}

	// Fetch existing household names for duplicate detection
	const { data: existingHouseholds } = await supabase
		.from('households')
		.select('name')
		.in('name', [...householdMap.values()].map((h) => h.rows[0]['household_name'].trim()));

	const existingNames = new Set((existingHouseholds ?? []).map((h: { name: string }) => h.name.trim().toLowerCase()));

	const result = {
		imported: { households: 0, guests: 0 },
		skipped: [] as { household: string; reason: string }[],
		errors: [] as { row: number; reason: string }[]
	};

	// Row index offset: 1 for header + 1 for 1-based
	let globalRowIndex = 2;

	for (const [, group] of householdMap) {
		const householdDisplayName = group.rows[0]['household_name'].trim();
		const householdKeyLower = householdDisplayName.toLowerCase();

		if (existingNames.has(householdKeyLower)) {
			result.skipped.push({ household: householdDisplayName, reason: 'Household already exists' });
			globalRowIndex += group.rows.length;
			continue;
		}

		// Try to insert household with auto-generated code (retry on collision)
		let householdId: string | null = null;
		for (let attempt = 0; attempt < 3; attempt++) {
			const code = generateCode();
			const { data: hh, error: hhErr } = await supabase
				.from('households')
				.insert({ name: householdDisplayName, unique_code: code })
				.select('id')
				.single();

			if (hhErr) {
				if (hhErr.code === '23505' && attempt < 2) continue; // retry on unique collision
				result.skipped.push({ household: householdDisplayName, reason: 'Failed to create household' });
				break;
			}

			householdId = hh.id;
			result.imported.households++;
			break;
		}

		if (!householdId) {
			globalRowIndex += group.rows.length;
			continue;
		}

		// Insert contact info from first row if any contact field is present
		const firstRow = group.rows[0];
		const hasContactInfo = CONTACT_FIELDS.some((f) => firstRow[f]?.trim());
		if (hasContactInfo) {
			await supabase.from('household_contact_info').insert({
				household_id: householdId,
				email: firstRow['email']?.trim() || null,
				phone: firstRow['phone']?.trim() || null,
				address_street: firstRow['address_street']?.trim() || null,
				address_city: firstRow['address_city']?.trim() || null,
				address_state: firstRow['address_state']?.trim() || null,
				address_country: firstRow['address_country']?.trim() || null,
				address_postal_code: firstRow['address_postal_code']?.trim() || null
			});
		}

		// Insert guests
		for (const row of group.rows) {
			const firstName = row['first_name']?.trim();
			const lastName = row['last_name']?.trim();

			if (!firstName || !lastName) {
				result.errors.push({ row: globalRowIndex, reason: `Missing first_name or last_name (household: ${householdDisplayName})` });
				globalRowIndex++;
				continue;
			}

			const isChild = row['is_child']?.trim() ? parseBoolean(row['is_child']) : false;

			const { error: guestErr } = await supabase.from('guests').insert({
				household_id: householdId,
				first_name: firstName,
				last_name: lastName,
				is_child: isChild
			});

			if (guestErr) {
				result.errors.push({ row: globalRowIndex, reason: `Failed to insert guest: ${firstName} ${lastName}` });
			} else {
				result.imported.guests++;
			}

			globalRowIndex++;
		}
	}

	return json(result);
};
