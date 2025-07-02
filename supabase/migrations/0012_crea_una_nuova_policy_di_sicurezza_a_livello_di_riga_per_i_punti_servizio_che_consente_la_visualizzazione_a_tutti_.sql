CREATE POLICY "Public punti_servizio are viewable by everyone."
ON public.punti_servizio
FOR SELECT
USING (true);