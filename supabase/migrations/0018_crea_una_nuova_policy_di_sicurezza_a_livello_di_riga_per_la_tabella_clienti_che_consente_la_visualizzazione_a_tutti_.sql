CREATE POLICY "Public clienti are viewable by everyone."
ON public.clienti
FOR SELECT
USING (true);