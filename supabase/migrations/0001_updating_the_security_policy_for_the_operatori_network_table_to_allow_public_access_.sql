DROP POLICY "Utenti autenticati possono visualizzare gli operatori network." ON public.operatori_network;
CREATE POLICY "Public operatori_network are viewable by everyone." ON public.operatori_network
FOR SELECT
USING (true);