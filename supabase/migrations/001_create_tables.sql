-- Households
create table public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  unique_code text not null unique,
  created_at timestamptz not null default now()
);

create unique index idx_households_unique_code on public.households (unique_code);

-- Guests
create table public.guests (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  is_child boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_guests_household_id on public.guests (household_id);

-- Events
create table public.events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  date date not null,
  time time not null,
  location text,
  description text
);

-- Guest-Event mapping (which guests are invited to which events)
create table public.guest_events (
  id uuid primary key default gen_random_uuid(),
  guest_id uuid not null references public.guests(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  unique (guest_id, event_id)
);

create index idx_guest_events_guest_id on public.guest_events (guest_id);

-- RSVPs
create table public.rsvps (
  id uuid primary key default gen_random_uuid(),
  guest_id uuid not null references public.guests(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  attending boolean,
  dietary_restrictions jsonb not null default '{"selections": [], "other": ""}',
  song_request text default '',
  submitted_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (guest_id, event_id)
);

create index idx_rsvps_guest_id on public.rsvps (guest_id);
