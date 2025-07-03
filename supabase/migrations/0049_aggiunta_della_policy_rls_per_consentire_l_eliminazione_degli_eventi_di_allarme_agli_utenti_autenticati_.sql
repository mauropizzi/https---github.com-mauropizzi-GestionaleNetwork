CREATE POLICY "Authenticated users can delete allarme_interventi."
ON public.allarme_interventi
FOR DELETE
USING (auth.role() = 'authenticated');