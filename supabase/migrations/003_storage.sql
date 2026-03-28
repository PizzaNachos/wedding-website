-- Create storage bucket for guest photo uploads
insert into storage.buckets (id, name, public)
values ('photos', 'photos', true);

-- Allow anyone to upload to the photos bucket
create policy "Anyone can upload photos"
  on storage.objects for insert
  with check (bucket_id = 'photos');

-- Allow anyone to view photos
create policy "Anyone can view photos"
  on storage.objects for select
  using (bucket_id = 'photos');
