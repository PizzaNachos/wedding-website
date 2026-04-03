-- ============================================================
-- Event-Based Invitations Migration
-- - Add display columns to events (image_path, address, sort_order)
-- - Recreate rsvps with event_id (per-event RSVP)
-- - Drop ceremony_interest (replaced by per-event yes/no)
-- ============================================================

-- 1. Add display columns to events
alter table public.events add column if not exists image_path text;
alter table public.events add column if not exists address text;
alter table public.events add column if not exists sort_order integer not null default 0;

-- 2. Update seed events with real data
update public.events set
  time = '13:00',
  location = 'St. Catherine''s Chapel on the Rock',
  image_path = '/images/rsvp/water_church.jpg',
  address = '10758 CO-7 Allenspark, CO 80510',
  description = 'Because of limited seating at the church, the ceremony guest list is smaller than the reception and limited to family only. We can''t wait to celebrate with all of our guests later that evening!',
  sort_order = 1
where name = 'Ceremony';

update public.events set
  time = '15:30',
  location = 'Wild Basin Lodge',
  image_path = '/images/rsvp/wbl.jpg',
  address = '1130 County Rd 84 W, Allenspark, CO',
  description = 'Cocktail Hour: 3:30pm
Dinner: 5pm
Event ends at 10pm',
  sort_order = 2
where name = 'Reception';

-- 3. Drop ceremony_interest table and type
drop table if exists public.ceremony_interest cascade;
drop type if exists ceremony_interest_level;

-- 4. Recreate rsvps with event_id (per-event RSVP)
drop table if exists public.rsvps cascade;

create table public.rsvps (
  id uuid primary key default gen_random_uuid(),
  guest_id uuid not null references public.guests(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  attending boolean,
  dietary_restrictions jsonb not null default '{"selections": [], "other": ""}',
  submitted_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (guest_id, event_id)
);

create index idx_rsvps_guest_event on public.rsvps (guest_id, event_id);

alter table public.rsvps enable row level security;

create policy "RSVPs are viewable by everyone"
  on public.rsvps for select using (true);

create policy "RSVPs can be inserted by anyone"
  on public.rsvps for insert with check (true);

create policy "RSVPs can be updated by anyone"
  on public.rsvps for update using (true);

create policy "Admins can delete rsvps"
  on public.rsvps for delete
  to authenticated using (true);
