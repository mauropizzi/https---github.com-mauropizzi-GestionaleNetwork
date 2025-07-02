CREATE POLICY "Public personale are viewable by everyone."
ON public.personale
FOR SELECT
USING (true);