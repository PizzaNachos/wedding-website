export interface Household {
	id: string;
	name: string;
	unique_code: string;
	created_at: string;
	guests: Guest[];
}

export interface Guest {
	id: string;
	household_id: string;
	first_name: string;
	last_name: string;
	is_child: boolean;
	created_at: string;
}

export interface Event {
	id: string;
	name: string;
	date: string;
	time: string;
	location: string | null;
	description: string | null;
}

export interface Rsvp {
	id: string;
	guest_id: string;
	attending: boolean | null;
	dietary_restrictions: DietaryRestrictions;
	song_request: string;
	submitted_at: string | null;
	updated_at: string;
}

export interface DietaryRestrictions {
	selections: string[];
	other: string;
}

export const DIETARY_OPTIONS = [
	'Vegetarian',
	'Vegan',
	'Gluten-Free',
	'Dairy-Free',
	'Nut Allergy',
] as const;

export type CeremonyInterestLevel = 'yes' | 'maybe' | 'not_likely' | 'other';

export const CEREMONY_INTEREST_OPTIONS: CeremonyInterestLevel[] = [
	'yes',
	'maybe',
	'not_likely',
	'other',
];

export interface CeremonyInterest {
	id: string;
	guest_id: string;
	interest_level: CeremonyInterestLevel;
	other_text: string | null;
	created_at: string;
	updated_at: string;
}

export interface HouseholdContactInfo {
	id: string;
	household_id: string;
	email: string;
	phone: string | null;
	address_street: string | null;
	address_city: string | null;
	address_state: string | null;
	address_country: string | null;
	address_postal_code: string | null;
	created_at: string;
	updated_at: string;
}

export interface PersonTag {
	guest_id?: string;
	name: string;
}

export interface PhotoUpload {
	id: string;
	storage_path: string | null;
	cloudflare_image_id: string | null;
	original_filename: string | null;
	uploaded_at: string;
	status: 'pending' | 'approved' | 'rejected';
	reviewed_at: string | null;
	reviewed_by: string | null;
	uploader_guest_id: string | null;
	event_id: string | null;
	custom_tags: string[];
	people_tags: PersonTag[];
}
