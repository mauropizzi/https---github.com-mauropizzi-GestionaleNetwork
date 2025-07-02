UPDATE public.punti_servizio
SET longitude = longitude / 100
WHERE ABS(longitude) > 180;