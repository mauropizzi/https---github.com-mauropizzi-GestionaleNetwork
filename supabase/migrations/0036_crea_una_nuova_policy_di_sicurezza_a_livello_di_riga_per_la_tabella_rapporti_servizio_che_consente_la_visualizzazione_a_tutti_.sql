CREATE POLICY "Public rapporti_servizio are viewable by everyone."
ON public.rapporti_servizio
FOR SELECT
USING (true);