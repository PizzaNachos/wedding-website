import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { randomBytes } from 'crypto';

// Usage: npx tsx scripts/import-guests.ts path/to/guests.csv
//
// CSV format:
// first_name,last_name,household_name,is_child,events_invited_to
// John,Smith,The Smith Family,false,"Ceremony,Reception"
// Jane,Smith,The Smith Family,false,"Ceremony,Reception"
// Alice,Johnson,Alice Johnson,false,Reception

const SUPABASE_URL = process.env.PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
	console.error('Missing env vars: PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
	console.error('Run with: PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/import-guests.ts guests.csv');
	process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface CsvRow {
	first_name: string;
	last_name: string;
	household_name: string;
	is_child: string;
	events_invited_to: string;
}

function parseCsv(content: string): CsvRow[] {
	const lines = content.trim().split('\n');
	const headers = lines[0].split(',').map((h) => h.trim());
	const rows: CsvRow[] = [];

	for (let i = 1; i < lines.length; i++) {
		const values: string[] = [];
		let current = '';
		let inQuotes = false;

		for (const char of lines[i]) {
			if (char === '"') {
				inQuotes = !inQuotes;
			} else if (char === ',' && !inQuotes) {
				values.push(current.trim());
				current = '';
			} else {
				current += char;
			}
		}
		values.push(current.trim());

		const row: Record<string, string> = {};
		headers.forEach((h, idx) => {
			row[h] = values[idx] ?? '';
		});
		rows.push(row as unknown as CsvRow);
	}

	return rows;
}

async function main() {
	const csvPath = process.argv[2];
	if (!csvPath) {
		console.error('Usage: npx tsx scripts/import-guests.ts <path-to-csv>');
		process.exit(1);
	}

	const csvContent = readFileSync(csvPath, 'utf-8');
	const rows = parseCsv(csvContent);

	console.log(`Parsed ${rows.length} guest rows from CSV`);

	// Fetch events to map names to IDs
	const { data: events, error: eventsError } = await supabase.from('events').select('*');
	if (eventsError || !events) {
		console.error('Failed to fetch events:', eventsError);
		process.exit(1);
	}

	const eventMap = new Map(events.map((e) => [e.name, e.id]));
	console.log(`Found ${events.length} events:`, [...eventMap.keys()].join(', '));

	// Group rows by household
	const householdGroups = new Map<string, CsvRow[]>();
	for (const row of rows) {
		const group = householdGroups.get(row.household_name) ?? [];
		group.push(row);
		householdGroups.set(row.household_name, group);
	}

	console.log(`\nImporting ${householdGroups.size} households...\n`);

	for (const [householdName, guests] of householdGroups) {
		const uniqueCode = randomBytes(6).toString('hex');

		const { data: household, error: hhError } = await supabase
			.from('households')
			.insert({ name: householdName, unique_code: uniqueCode })
			.select()
			.single();

		if (hhError || !household) {
			console.error(`Failed to create household "${householdName}":`, hhError);
			continue;
		}

		console.log(`Household: ${householdName}`);
		console.log(`  RSVP link: /rsvp/${uniqueCode}`);

		for (const guest of guests) {
			const { data: guestRecord, error: guestError } = await supabase
				.from('guests')
				.insert({
					household_id: household.id,
					first_name: guest.first_name,
					last_name: guest.last_name,
					is_child: guest.is_child === 'true'
				})
				.select()
				.single();

			if (guestError || !guestRecord) {
				console.error(`  Failed to create guest ${guest.first_name} ${guest.last_name}:`, guestError);
				continue;
			}

			const eventNames = guest.events_invited_to.split(',').map((s) => s.trim());
			for (const eventName of eventNames) {
				const eventId = eventMap.get(eventName);
				if (!eventId) {
					console.warn(`  Warning: Unknown event "${eventName}" for ${guest.first_name}`);
					continue;
				}

				await supabase.from('guest_events').insert({
					guest_id: guestRecord.id,
					event_id: eventId
				});

				// Pre-create RSVP row
				await supabase.from('rsvps').insert({
					guest_id: guestRecord.id,
					event_id: eventId,
					attending: null
				});
			}

			console.log(`  Guest: ${guest.first_name} ${guest.last_name} -> ${eventNames.join(', ')}`);
		}

		console.log('');
	}

	console.log('Import complete!');
}

main().catch(console.error);
