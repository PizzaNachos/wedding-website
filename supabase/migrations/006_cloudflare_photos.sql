-- Add Cloudflare Images support and rich metadata to photo_uploads

-- New columns for Cloudflare image ID and metadata
ALTER TABLE public.photo_uploads
  ADD COLUMN cloudflare_image_id text,
  ADD COLUMN uploader_guest_id uuid REFERENCES public.guests(id) ON DELETE SET NULL,
  ADD COLUMN event_id uuid REFERENCES public.events(id) ON DELETE SET NULL,
  ADD COLUMN custom_tags jsonb NOT NULL DEFAULT '[]',
  ADD COLUMN people_tags jsonb NOT NULL DEFAULT '[]';

-- Make storage_path nullable (new Cloudflare-backed photos won't use it)
ALTER TABLE public.photo_uploads
  ALTER COLUMN storage_path DROP NOT NULL;

-- Drop unique constraint on storage_path (no longer the sole identifier)
ALTER TABLE public.photo_uploads
  DROP CONSTRAINT IF EXISTS photo_uploads_storage_path_key;

-- Indexes for common queries
CREATE INDEX idx_photo_uploads_event_id ON public.photo_uploads (event_id);
CREATE INDEX idx_photo_uploads_uploader ON public.photo_uploads (uploader_guest_id);
CREATE INDEX idx_photo_uploads_cloudflare ON public.photo_uploads (cloudflare_image_id) WHERE cloudflare_image_id IS NOT NULL;

-- Tighten RLS: uploads now go through server endpoint with service role,
-- so remove the anonymous insert policy
DROP POLICY IF EXISTS "Anyone can insert photo_uploads" ON public.photo_uploads;
