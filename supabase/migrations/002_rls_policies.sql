alter table public.households enable row level security;
alter table public.guests enable row level security;
alter table public.events enable row level security;
alter table public.guest_events enable row level security;
alter table public.rsvps enable row level security;

-- Events are publicly readable
create policy "Events are viewable by everyone"
  on public.events for select using (true);

-- Households: readable by anon (needed for code lookup)
create policy "Households are viewable by everyone"
  on public.households for select using (true);

-- Guests: readable by anon (needed for RSVP form population)
create policy "Guests are viewable by everyone"
  on public.guests for select using (true);

-- Guest-events: readable by anon
create policy "Guest events are viewable by everyone"
  on public.guest_events for select using (true);

-- RSVPs: readable, insertable, and updatable by anon
create policy "RSVPs are viewable by everyone"
  on public.rsvps for select using (true);

create policy "RSVPs can be inserted by anyone"
  on public.rsvps for insert with check (true);

create policy "RSVPs can be updated by anyone"
  on public.rsvps for update using (true);
