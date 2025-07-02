UPDATE public.punti_servizio
SET longitude = longitude / 1000000
WHERE ABS(longitude) > 180 AND longitude % 1 = 0;