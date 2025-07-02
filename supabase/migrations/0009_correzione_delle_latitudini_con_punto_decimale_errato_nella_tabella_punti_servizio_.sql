UPDATE public.punti_servizio
SET latitude = latitude / 100
WHERE ABS(latitude) > 90;