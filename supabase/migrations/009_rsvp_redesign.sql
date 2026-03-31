-- ============================================================
-- RSVP Redesign Migration
-- - Household-level contact info (replaces per-guest)
-- - Ceremony interest table (graduated scale)
-- - Simplified rsvps table (no event_id)
-- ============================================================

-- 1. Household Contact Info
create table public.household_contact_info (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null unique references public.households(id) on delete cascade,
  email text not null,
  phone text,
  address_street text,
  address_city text,
  address_state text,
  address_country text,
  address_postal_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_household_contact_info_household_id on public.household_contact_info (household_id);

alter table public.household_contact_info enable row level security;

create policy "Anyone can insert household_contact_info"
  on public.household_contact_info for insert
  with check (true);

create policy "Anyone can update household_contact_info"
  on public.household_contact_info for update
  using (true);

create policy "Admins can read household_contact_info"
  on public.household_contact_info for select
  to authenticated using (true);

create policy "Admins can delete household_contact_info"
  on public.household_contact_info for delete
  to authenticated using (true);

-- 2. Ceremony Interest
create type ceremony_interest_level as enum ('yes', 'maybe', 'not_likely', 'other');

create table public.ceremony_interest (
  id uuid primary key default gen_random_uuid(),
  guest_id uuid not null unique references public.guests(id) on delete cascade,
  interest_level ceremony_interest_level not null,
  other_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_ceremony_interest_guest_id on public.ceremony_interest (guest_id);

alter table public.ceremony_interest enable row level security;

create policy "Anyone can insert ceremony_interest"
  on public.ceremony_interest for insert
  with check (true);

create policy "Anyone can update ceremony_interest"
  on public.ceremony_interest for update
  using (true);

create policy "Ceremony interest viewable by everyone"
  on public.ceremony_interest for select
  using (true);

create policy "Admins can delete ceremony_interest"
  on public.ceremony_interest for delete
  to authenticated using (true);

-- 3. Migrate existing contact data to household_contact_info (if any exists)
insert into public.household_contact_info (household_id, email, phone, address_street, address_city, address_state, address_country, address_postal_code, created_at, updated_at)
select distinct on (g.household_id)
  g.household_id,
  gci.email,
  gci.phone,
  gci.address_street,
  gci.address_city,
  gci.address_state,
  'US',
  gci.address_zip,
  gci.created_at,
  gci.updated_at
from public.guest_contact_info gci
join public.guests g on g.id = gci.guest_id
where gci.email is not null and gci.email != ''
order by g.household_id, gci.created_at asc;

-- 4. Simplify rsvps table (drop event_id dependency)
drop table if exists public.rsvps cascade;

create table public.rsvps (
  id uuid primary key default gen_random_uuid(),
  guest_id uuid not null unique references public.guests(id) on delete cascade,
  attending boolean,
  dietary_restrictions jsonb not null default '{"selections": [], "other": ""}',
  song_request text default '',
  submitted_at timestamptz,
  updated_at timestamptz not null default now()
);

create index idx_rsvps_guest_id on public.rsvps (guest_id);

alter table public.rsvps enable row level security;

create policy "RSVPs are viewable by everyone"
  on public.rsvps for select using (true);

create policy "RSVPs can be inserted by anyone"
  on public.rsvps for insert with check (true);

create policy "RSVPs can be updated by anyone"
  on public.rsvps for update using (true);
