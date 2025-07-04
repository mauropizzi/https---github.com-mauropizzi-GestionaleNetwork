UPDATE public.profiles SET role = 'Personale esterno' WHERE role = 'user';
UPDATE public.profiles SET role = 'Amministratore' WHERE role = 'admin';
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'Personale esterno';