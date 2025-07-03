CREATE TABLE public.richieste_manutenzione (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  report_id UUID REFERENCES public.rapporti_servizio(id) ON DELETE SET NULL,
  service_point_id UUID REFERENCES public.punti_servizio(id) ON DELETE SET NULL,
  vehicle_plate TEXT NOT NULL,
  issue_description TEXT,
  status TEXT DEFAULT 'Pending',
  priority TEXT DEFAULT 'Medium',
  requested_by_employee_id UUID REFERENCES public.personale(id) ON DELETE SET NULL,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.richieste_manutenzione ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can insert maintenance requests." ON public.richieste_manutenzione FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can view maintenance requests." ON public.richieste_manutenzione FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update their own maintenance requests." ON public.richieste_manutenzione FOR UPDATE USING (auth.role() = 'authenticated');