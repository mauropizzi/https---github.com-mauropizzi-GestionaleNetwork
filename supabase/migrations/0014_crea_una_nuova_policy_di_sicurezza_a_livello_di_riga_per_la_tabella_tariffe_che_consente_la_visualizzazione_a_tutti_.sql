CREATE POLICY "Public tariffe are viewable by everyone."
ON public.tariffe
FOR SELECT
USING (true);