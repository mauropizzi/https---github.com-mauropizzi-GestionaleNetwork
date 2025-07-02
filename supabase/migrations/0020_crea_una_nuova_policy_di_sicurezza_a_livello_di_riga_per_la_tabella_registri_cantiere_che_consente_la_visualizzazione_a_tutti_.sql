CREATE POLICY "Public registri_cantiere are viewable by everyone."
ON public.registri_cantiere
FOR SELECT
USING (true);