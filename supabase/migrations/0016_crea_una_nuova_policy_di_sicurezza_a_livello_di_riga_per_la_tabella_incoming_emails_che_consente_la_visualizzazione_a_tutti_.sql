CREATE POLICY "Public incoming_emails are viewable by everyone."
ON public.incoming_emails
FOR SELECT
USING (true);