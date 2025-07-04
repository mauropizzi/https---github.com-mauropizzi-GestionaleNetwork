CREATE TABLE public.client_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  client_id UUID NOT NULL REFERENCES public.clienti(id) ON DELETE CASCADE,
  department TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  notes TEXT
);

ALTER TABLE public.client_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view client contacts."
ON public.client_contacts FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert their client contacts."
ON public.client_contacts FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update their client contacts."
ON public.client_contacts FOR UPDATE
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete their client contacts."
ON public.client_contacts FOR DELETE
USING (auth.role() = 'authenticated');