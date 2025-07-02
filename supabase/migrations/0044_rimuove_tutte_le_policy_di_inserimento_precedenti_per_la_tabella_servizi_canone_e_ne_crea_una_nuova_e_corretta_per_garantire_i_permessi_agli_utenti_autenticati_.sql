-- Rimuove tutte le possibili policy di inserimento precedenti per evitare conflitti
DROP POLICY IF EXISTS "Allow insert for authenticated users on servizi_canone" ON public.servizi_canone;
DROP POLICY IF EXISTS "Allow authenticated insert on servizi_canone" ON public.servizi_canone;
DROP POLICY IF EXISTS "Authenticated users can insert servizi_canone." ON public.servizi_canone;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.servizi_canone;

-- Crea la nuova policy corretta
CREATE POLICY "Permetti inserimento canoni per utenti autenticati" ON public.servizi_canone
FOR INSERT TO authenticated
WITH CHECK (true);