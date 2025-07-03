ALTER TABLE public.rapporti_servizio
ADD COLUMN service_location_id UUID REFERENCES public.punti_servizio(id);