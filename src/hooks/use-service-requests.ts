import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';
import { ServiziRichiesti, PuntoServizio as PuntoServizioBase, Fornitore, Cliente } from '@/lib/anagrafiche-data'; // Corrected import

// Extend types to include joined data structure
interface PuntoServizioExtended extends PuntoServizioBase {
  clienti: { nome_cliente: string }[];
}

export const useServiceRequests = () => {
  const [serviceRequests, setServiceRequests] = useState<ServiziRichiesti[]>([]); // Use ServiziRichiesti
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchServiceRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('servizi_richiesti') // Corrected table name
      .select('*, clienti(nome_cliente), punti_servizio(nome_punto_servizio), fornitori(nome_fornitore)')
      .order('created_at', { ascending: false });

    if (error) {
      showError(`Error fetching service requests: ${error.message}`);
      setError(error.message);
      setServiceRequests([]);
    } else {
      // Data is already mapped correctly by Supabase select with joins
      setServiceRequests(data || []);
    }
    setLoading(false);
  }, []);

  const fetchServicePointDetails = useCallback(async (servicePointId: string) => {
    const { data, error } = await supabase
      .from('punti_servizio')
      .select('*, clienti(nome_cliente)')
      .eq('id', servicePointId)
      .single();

    if (error) {
      showError(`Error fetching service point details: ${error.message}`);
      return null;
    }

    // Ensure 'clienti' is an array for consistency, even if single() returns a single object
    const extendedData: PuntoServizioExtended = {
      ...data,
      clienti: data.clienti ? [data.clienti] : [], // Wrap single object in an array
    };

    return extendedData;
  }, []);

  const fetchFornitoreDetails = useCallback(async (fornitoreId: string) => {
    const { data, error } = await supabase
      .from('fornitori')
      .select('*')
      .eq('id', fornitoreId)
      .single();

    if (error) {
      showError(`Error fetching fornitore details: ${error.message}`);
      return null;
    }
    return data;
  }, []);

  const fetchClientDetails = useCallback(async (clientId: string) => {
    const { data, error } = await supabase
      .from('clienti')
      .select('*')
      .eq('id', clientId)
      .single();

    if (error) {
      showError(`Error fetching client details: ${error.message}`);
      return null;
    }
    return data;
  }, []);

  useEffect(() => {
    fetchServiceRequests();
  }, [fetchServiceRequests]);

  return {
    serviceRequests,
    loading,
    error,
    fetchServiceRequests,
    fetchServicePointDetails,
    fetchFornitoreDetails,
    fetchClientDetails,
  };
};