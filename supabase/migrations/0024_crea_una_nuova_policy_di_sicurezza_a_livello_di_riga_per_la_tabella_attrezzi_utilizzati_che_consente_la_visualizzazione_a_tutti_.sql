CREATE POLICY "Public attrezzi_utilizzati are viewable by everyone."
ON public.attrezzi_utilizzati
FOR SELECT
USING (true);