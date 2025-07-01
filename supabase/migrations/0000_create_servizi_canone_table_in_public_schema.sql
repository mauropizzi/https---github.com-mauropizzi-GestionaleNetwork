CREATE TABLE public.servizi_canone (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT now(),
  service_point_id UUID NOT NULL REFERENCES public.punti_servizio(id) ON DELETE CASCADE,
  fornitore_id UUID REFERENCES public.fornitori(id) ON DELETE SET NULL,
  tipo_canone TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'Attivo',
  notes TEXT
);

ALTER TABLE public.servizi_canone ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view servizi_canone." ON public.servizi_canone FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert servizi_canone." ON public.servizi_canone FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update servizi_canone." ON public.servizi_canone FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete servizi_canone." ON public.servizi_canone FOR DELETE USING (auth.role() = 'authenticated');