CREATE POLICY "Public servizi_canone are viewable by everyone."
ON public.servizi_canone
FOR SELECT
USING (true);