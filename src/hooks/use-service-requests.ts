import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ServiceRequest } from '@/lib/service-request-data'; // Corrected import path
import { PuntoServizio } from '@/lib/anagrafiche-data'; // Assuming PuntoServizio type is defined here
import { showError } from '@/utils/toast';

interface UseServiceRequestsResult {
  serviceRequests: ServiceRequest[];
  isLoading: boolean;
  error: string | null;
  refreshServiceRequests: () => void;
}

export const useServiceRequests = (): UseServiceRequestsResult => {
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchServiceRequests = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('service_requests')
        .select(`
          id,
          type,
          client_id,
          service_point_id,
          fornitore_id,
          start_date,
          start_time,
          end_date,
          end_time,
          status,
          notes,
          calculated_cost,
          multiplier,
          created_at,
          updated_at,
          clienti:client_id(nome_cliente),
          punti_servizio:service_point_id(nome_punto_servizio, id_cliente, clienti(nome_cliente)),
          fornitori:fornitore_id(nome)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Map the fetched data to match the ServiceRequest type,
      // ensuring 'clienti', 'punti_servizio', and 'fornitori' are handled as single objects or null.
      const formattedData: ServiceRequest[] = data.map((req: any) => {
        return {
          ...req,
          // Ensure 'clienti' is a single object or null
          clienti: req.clienti || null,
          // Ensure 'punti_servizio' is a single object or null, and its nested 'clienti' is also a single object or null
          punti_servizio: req.punti_servizio ? {
            ...req.punti_servizio,
            clienti: req.punti_servizio.clienti || null
          } : null,
          // Ensure 'fornitori' is a single object or null
          fornitori: req.fornitori || null,
        };
      });

      setServiceRequests(formattedData);
    } catch (err: any) {
      console.error("Error fetching service requests:", err);
      setError(err.message || "Failed to fetch service requests.");
      showError(err.message || "Failed to fetch service requests.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServiceRequests();
  }, [fetchServiceRequests]);

  return { serviceRequests, isLoading, error, refreshServiceRequests: fetchServiceRequests };
};