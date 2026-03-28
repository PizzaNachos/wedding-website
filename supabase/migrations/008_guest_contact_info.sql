-- Guest contact information (separate table for privacy - admin-only read access)
create table public.guest_contact_info (
  id uuid primary key default gen_random_uuid(),
  guest_id uuid not null unique references public.guests(id) on delete cascade,
  email text not null,
  phone text,
  address_street text,
  address_unit text,
  address_city text,
  address_state text,
  address_zip text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_guest_contact_info_guest_id on public.guest_contact_info (guest_id);

alter table public.guest_contact_info enable row level security;

-- Anon can INSERT (first RSVP submission)
create policy "Anyone can insert guest_contact_info"
  on public.guest_contact_info for insert
  with check (true);

-- Anon can UPDATE (re-submission of RSVP)
create policy "Anyone can update guest_contact_info"
  on public.guest_contact_info for update
  using (true);

-- Only authenticated (admin) can SELECT
create policy "Admins can read guest_contact_info"
  on public.guest_contact_info for select
  to authenticated using (true);

-- Admins can delete
create policy "Admins can delete guest_contact_info"
  on public.guest_contact_info for delete
  to authenticated using (true);
