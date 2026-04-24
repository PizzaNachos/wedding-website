-- Children's meal flag on guests
ALTER TABLE public.guests
  ADD COLUMN IF NOT EXISTS child_meal boolean NOT NULL DEFAULT false;

-- Reframe the Ceremony event description as an interest-gathering message
UPDATE public.events SET description =
  E'Seating at the church is limited, so we''re gathering interest rather than taking formal reservations for the ceremony. Please let us know if you''re hoping to attend — we''ll do our best to accommodate, and we cannot wait to celebrate with everyone at the reception!'
WHERE name = 'Ceremony';

UPDATE public.events SET description_es =
  E'La capacidad en la iglesia es limitada, así que estamos recopilando interés en lugar de hacer reservaciones formales para la ceremonia. Por favor indícanos si esperas asistir — haremos lo posible por acomodarte, ¡y no podemos esperar para celebrar con todos en la recepción!'
WHERE name = 'Ceremony';
