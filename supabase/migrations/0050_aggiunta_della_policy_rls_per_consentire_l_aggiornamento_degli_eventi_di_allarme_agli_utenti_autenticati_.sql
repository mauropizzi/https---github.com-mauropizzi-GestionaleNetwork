CREATE POLICY "Authenticated users can update allarme_interventi."
ON public.allarme_interventi
FOR UPDATE
USING (auth.role() = 'authenticated');