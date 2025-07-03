ALTER TABLE public.registri_cantiere
ADD COLUMN service_point_id UUID REFERENCES public.punti_servizio(id);