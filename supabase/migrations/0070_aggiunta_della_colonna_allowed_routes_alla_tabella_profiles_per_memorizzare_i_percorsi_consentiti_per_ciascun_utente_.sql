ALTER TABLE public.profiles
ADD COLUMN allowed_routes JSONB DEFAULT '[]'::jsonb;