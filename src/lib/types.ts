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
	guest_events: GuestEvent[];
}

export interface Event {
	id: string;
	name: string;
	date: string;
	time: string;
	location: string | null;
	description: string | null;
}

export interface GuestEvent {
	id: string;
	guest_id: string;
	event_id: string;
	events: Event;
}

export interface Rsvp {
	id: string;
	guest_id: string;
	event_id: string;
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

export interface GuestContactInfo {
	id: string;
	guest_id: string;
	email: string;
	phone: string | null;
	address_street: string | null;
	address_unit: string | null;
	address_city: string | null;
	address_state: string | null;
	address_zip: string | null;
	created_at: string;
	updated_at: string;
}

export const US_STATES = [
	{ value: 'AL', label: 'Alabama' },
	{ value: 'AK', label: 'Alaska' },
	{ value: 'AZ', label: 'Arizona' },
	{ value: 'AR', label: 'Arkansas' },
	{ value: 'CA', label: 'California' },
	{ value: 'CO', label: 'Colorado' },
	{ value: 'CT', label: 'Connecticut' },
	{ value: 'DE', label: 'Delaware' },
	{ value: 'DC', label: 'District of Columbia' },
	{ value: 'FL', label: 'Florida' },
	{ value: 'GA', label: 'Georgia' },
	{ value: 'HI', label: 'Hawaii' },
	{ value: 'ID', label: 'Idaho' },
	{ value: 'IL', label: 'Illinois' },
	{ value: 'IN', label: 'Indiana' },
	{ value: 'IA', label: 'Iowa' },
	{ value: 'KS', label: 'Kansas' },
	{ value: 'KY', label: 'Kentucky' },
	{ value: 'LA', label: 'Louisiana' },
	{ value: 'ME', label: 'Maine' },
	{ value: 'MD', label: 'Maryland' },
	{ value: 'MA', label: 'Massachusetts' },
	{ value: 'MI', label: 'Michigan' },
	{ value: 'MN', label: 'Minnesota' },
	{ value: 'MS', label: 'Mississippi' },
	{ value: 'MO', label: 'Missouri' },
	{ value: 'MT', label: 'Montana' },
	{ value: 'NE', label: 'Nebraska' },
	{ value: 'NV', label: 'Nevada' },
	{ value: 'NH', label: 'New Hampshire' },
	{ value: 'NJ', label: 'New Jersey' },
	{ value: 'NM', label: 'New Mexico' },
	{ value: 'NY', label: 'New York' },
	{ value: 'NC', label: 'North Carolina' },
	{ value: 'ND', label: 'North Dakota' },
	{ value: 'OH', label: 'Ohio' },
	{ value: 'OK', label: 'Oklahoma' },
	{ value: 'OR', label: 'Oregon' },
	{ value: 'PA', label: 'Pennsylvania' },
	{ value: 'RI', label: 'Rhode Island' },
	{ value: 'SC', label: 'South Carolina' },
	{ value: 'SD', label: 'South Dakota' },
	{ value: 'TN', label: 'Tennessee' },
	{ value: 'TX', label: 'Texas' },
	{ value: 'UT', label: 'Utah' },
	{ value: 'VT', label: 'Vermont' },
	{ value: 'VA', label: 'Virginia' },
	{ value: 'WA', label: 'Washington' },
	{ value: 'WV', label: 'West Virginia' },
	{ value: 'WI', label: 'Wisconsin' },
	{ value: 'WY', label: 'Wyoming' },
] as const;

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
