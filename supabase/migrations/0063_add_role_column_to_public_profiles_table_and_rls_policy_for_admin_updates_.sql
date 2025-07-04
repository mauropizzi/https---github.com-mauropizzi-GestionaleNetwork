ALTER TABLE public.profiles
ADD COLUMN role TEXT DEFAULT 'user';

CREATE POLICY "Admins can update all profiles" ON public.profiles
FOR UPDATE TO authenticated
USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));