ALTER TABLE public.registri_cantiere
ADD COLUMN addetto_riconsegna_security_service UUID REFERENCES public.personale(id);