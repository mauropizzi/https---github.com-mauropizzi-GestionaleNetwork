-- Reimposta le policy per la tabella public.servizi_canone
DROP POLICY IF EXISTS "Allow insert for authenticated users on servizi_canone" ON public.servizi_canone;
DROP POLICY IF EXISTS "Allow authenticated insert on servizi_canone" ON public.servizi_canone;
DROP POLICY IF EXISTS "Authenticated users can insert servizi_canone." ON public.servizi_canone;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.servizi_canone;
DROP POLICY IF EXISTS "Permetti inserimento canoni per utenti autenticati" ON public.servizi_canone; -- La policy che causa l'errore attuale
DROP POLICY IF EXISTS "Authenticated users can update servizi_canone." ON public.servizi_canone;
DROP POLICY IF EXISTS "Authenticated users can delete servizi_canone." ON public.servizi_canone;
DROP POLICY IF EXISTS "Public servizi_canone are viewable by everyone." ON public.servizi_canone;

CREATE POLICY "Public servizi_canone are viewable by everyone." ON public.servizi_canone FOR SELECT USING (true);
CREATE POLICY "Permetti inserimento canoni per utenti autenticati" ON public.servizi_canone FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update servizi_canone." ON public.servizi_canone FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (true);
CREATE POLICY "Authenticated users can delete servizi_canone." ON public.servizi_canone FOR DELETE USING (auth.role() = 'authenticated');

-- Reimposta le policy per la tabella public.tariffe
DROP POLICY IF EXISTS "Authenticated users can insert tariffe." ON public.tariffe;
DROP POLICY IF EXISTS "Authenticated users can update tariffe." ON public.tariffe;
DROP POLICY IF EXISTS "Authenticated users can delete tariffe." ON public.tariffe;
DROP POLICY IF EXISTS "Public tariffe are viewable by everyone." ON public.tariffe;

CREATE POLICY "Public tariffe are viewable by everyone." ON public.tariffe FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert tariffe." ON public.tariffe FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update tariffe." ON public.tariffe FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (true);
CREATE POLICY "Authenticated users can delete tariffe." ON public.tariffe FOR DELETE USING (auth.role() = 'authenticated');