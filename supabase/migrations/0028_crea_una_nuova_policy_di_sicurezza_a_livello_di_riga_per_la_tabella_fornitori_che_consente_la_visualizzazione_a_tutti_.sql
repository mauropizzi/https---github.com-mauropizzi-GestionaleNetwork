CREATE POLICY "Public fornitori are viewable by everyone."
ON public.fornitori
FOR SELECT
USING (true);