ALTER TABLE public.servizi_canone
ADD COLUMN calculated_cost NUMERIC,
ADD COLUMN client_id UUID REFERENCES public.clienti(id),
ADD COLUMN unita_misura TEXT;

CREATE OR REPLACE FUNCTION public.set_client_id_for_servizi_canone()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.service_point_id IS NOT NULL THEN
    SELECT id_cliente INTO NEW.client_id
    FROM public.punti_servizio
    WHERE id = NEW.service_point_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_servizi_canone_insert_update
BEFORE INSERT OR UPDATE OF service_point_id ON public.servizi_canone
FOR EACH ROW EXECUTE FUNCTION public.set_client_id_for_servizi_canone();