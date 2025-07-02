CREATE POLICY "Public servizi_richiesti are viewable by everyone."
ON public.servizi_richiesti
FOR SELECT
USING (true);