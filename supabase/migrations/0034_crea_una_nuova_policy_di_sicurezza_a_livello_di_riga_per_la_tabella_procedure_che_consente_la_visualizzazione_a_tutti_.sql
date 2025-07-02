CREATE POLICY "Public procedure are viewable by everyone."
ON public.procedure
FOR SELECT
USING (true);