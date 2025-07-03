ALTER TABLE public.registri_cantiere
ADD COLUMN start_datetime TIMESTAMP WITH TIME ZONE,
ADD COLUMN end_datetime TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.registri_cantiere
DROP COLUMN service_hours;