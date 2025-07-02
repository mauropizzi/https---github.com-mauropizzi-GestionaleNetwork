DROP POLICY IF EXISTS "Allow authenticated insert on servizi_canone" ON public.servizi_canone;
CREATE POLICY "Allow insert for authenticated users on servizi_canone"
ON public.servizi_canone
FOR INSERT
TO authenticated
WITH CHECK (true);