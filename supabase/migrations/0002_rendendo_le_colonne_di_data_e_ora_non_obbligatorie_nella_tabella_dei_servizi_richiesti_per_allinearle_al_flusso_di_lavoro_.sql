ALTER TABLE public.servizi_richiesti ALTER COLUMN start_time DROP NOT NULL;
ALTER TABLE public.servizi_richiesti ALTER COLUMN end_time DROP NOT NULL;
ALTER TABLE public.servizi_richiesti ALTER COLUMN end_date DROP NOT NULL;