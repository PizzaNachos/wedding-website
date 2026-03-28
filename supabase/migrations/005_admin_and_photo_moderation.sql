-- Photo moderation table
create table public.photo_uploads (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null unique,
  original_filename text,
  uploaded_at timestamptz not null default now(),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id)
);

alter table public.photo_uploads enable row level security;

-- Photo uploads RLS
create policy "Anyone can insert photo_uploads"
  on public.photo_uploads for insert with check (true);

create policy "Public can see approved photos or admins see all"
  on public.photo_uploads for select
  using (status = 'approved' or auth.role() = 'authenticated');

create policy "Admins can update photo_uploads"
  on public.photo_uploads for update
  to authenticated using (true);

create policy "Admins can delete photo_uploads"
  on public.photo_uploads for delete
  to authenticated using (true);

-- Admin write policies for households
create policy "Admins can insert households"
  on public.households for insert
  to authenticated with check (true);

create policy "Admins can update households"
  on public.households for update
  to authenticated using (true);

create policy "Admins can delete households"
  on public.households for delete
  to authenticated using (true);

-- Admin write policies for guests
create policy "Admins can insert guests"
  on public.guests for insert
  to authenticated with check (true);

create policy "Admins can update guests"
  on public.guests for update
  to authenticated using (true);

create policy "Admins can delete guests"
  on public.guests for delete
  to authenticated using (true);

-- Admin write policies for events
create policy "Admins can insert events"
  on public.events for insert
  to authenticated with check (true);

create policy "Admins can update events"
  on public.events for update
  to authenticated using (true);

create policy "Admins can delete events"
  on public.events for delete
  to authenticated using (true);

-- Admin write policies for guest_events
create policy "Admins can insert guest_events"
  on public.guest_events for insert
  to authenticated with check (true);

create policy "Admins can update guest_events"
  on public.guest_events for update
  to authenticated using (true);

create policy "Admins can delete guest_events"
  on public.guest_events for delete
  to authenticated using (true);

-- Admin write policies for rsvps (insert already allowed by anon, add admin update/delete)
create policy "Admins can delete rsvps"
  on public.rsvps for delete
  to authenticated using (true);

-- Admin storage policy
create policy "Admins can delete photos from storage"
  on storage.objects for delete
  to authenticated using (bucket_id = 'photos');
