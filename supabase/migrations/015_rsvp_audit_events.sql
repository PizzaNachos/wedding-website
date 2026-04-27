-- Immutable RSVP audit events.
create table public.rsvp_audit_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  household_id uuid not null,
  guest_id uuid,
  source text not null check (source in ('public', 'admin')),
  action text not null,
  visitor_id uuid,
  admin_user_id uuid,
  snapshot jsonb not null,
  metadata jsonb not null default '{}'
);

create index idx_rsvp_audit_events_household_id
  on public.rsvp_audit_events (household_id, created_at desc);

create index idx_rsvp_audit_events_guest_id
  on public.rsvp_audit_events (guest_id, created_at desc);

create index idx_rsvp_audit_events_created_at
  on public.rsvp_audit_events (created_at desc);

create index idx_rsvp_audit_events_visitor_id
  on public.rsvp_audit_events (visitor_id);

alter table public.rsvp_audit_events enable row level security;

create policy "Admins can read rsvp audit events"
  on public.rsvp_audit_events for select
  to authenticated using (true);
