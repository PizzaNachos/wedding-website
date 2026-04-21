-- Add Spanish description column to events
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS description_es text;

-- Seed Spanish descriptions for existing events
UPDATE public.events SET description_es =
  E'Debido a la capacidad limitada de asientos en la iglesia, la lista de invitados para la ceremonia es más pequeña que la de la recepción y está limitada solo a familiares. ¡No podemos esperar para celebrar con todos nuestros invitados más tarde esa noche!'
WHERE name = 'Ceremony';

UPDATE public.events SET description_es =
  E'Hora de Cóctel: 3:30pm\nCena: 5pm\nEl evento termina a las 10pm'
WHERE name = 'Reception';
