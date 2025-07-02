CREATE POLICY "Public automezzi_utilizzati are viewable by everyone."
ON public.automezzi_utilizzati
FOR SELECT
USING (true);