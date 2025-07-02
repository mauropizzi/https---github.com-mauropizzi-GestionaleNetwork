UPDATE public.punti_servizio
SET latitude = latitude / 1000000
WHERE ABS(latitude) > 90 AND latitude % 1 = 0;