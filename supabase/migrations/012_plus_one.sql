-- Add plus-one support to guests table

ALTER TABLE public.guests
  ADD COLUMN allows_plus_one boolean NOT NULL DEFAULT false,
  ADD COLUMN is_plus_one boolean NOT NULL DEFAULT false,
  ADD COLUMN plus_one_of uuid REFERENCES public.guests(id) ON DELETE CASCADE;

-- Each host can have at most one plus-one
CREATE UNIQUE INDEX idx_guests_plus_one_of
  ON public.guests (plus_one_of)
  WHERE plus_one_of IS NOT NULL;

-- A plus-one must have is_plus_one=true and vice versa
ALTER TABLE public.guests
  ADD CONSTRAINT chk_plus_one_consistency
  CHECK (
    (is_plus_one = false AND plus_one_of IS NULL)
    OR (is_plus_one = true AND plus_one_of IS NOT NULL)
  );

-- A guest who is a plus-one cannot itself allow a plus-one
ALTER TABLE public.guests
  ADD CONSTRAINT chk_no_recursive_plus_one
  CHECK (NOT (allows_plus_one = true AND is_plus_one = true));
