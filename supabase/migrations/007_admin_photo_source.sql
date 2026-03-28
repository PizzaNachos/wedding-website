-- Add source column to track whether a photo was uploaded by a guest or admin
alter table public.photo_uploads
  add column source text not null default 'guest'
  constraint photo_uploads_source_check check (source in ('guest', 'admin'));

-- Backfill: all existing photos are guest uploads
update public.photo_uploads set source = 'guest' where source = 'guest';

-- Index for filtering by source
create index idx_photo_uploads_source on public.photo_uploads (source);

-- Add category column for photo gallery tabs (separate from RSVP events)
alter table public.photo_uploads
  add column category text
  constraint photo_uploads_category_check check (category in ('engagement', 'ceremony', 'reception'));

create index idx_photo_uploads_category on public.photo_uploads (category);

