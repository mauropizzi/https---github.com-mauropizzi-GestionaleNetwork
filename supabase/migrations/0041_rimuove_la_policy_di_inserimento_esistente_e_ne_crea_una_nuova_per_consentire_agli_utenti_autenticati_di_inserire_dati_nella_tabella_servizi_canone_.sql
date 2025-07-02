DROP POLICY IF EXISTS "Authenticated users can insert servizi_canone." ON public.servizi_canone;
CREATE POLICY "Allow authenticated insert on servizi_canone"
ON public.servizi_canone
FOR INSERT
TO authenticated
WITH CHECK (true);