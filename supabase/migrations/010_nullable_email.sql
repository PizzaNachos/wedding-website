-- Make email nullable in household_contact_info so households can be imported
-- without an email address. Guests will supply their email when they RSVP.
ALTER TABLE household_contact_info ALTER COLUMN email DROP NOT NULL;
