import { useState, useEffect, useCallback, useMemo } from "react";
import { format, parseISO } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { calculateServiceCost } from "@/lib/data-fetching";
import { showError } from "@/utils/toast";
import { PuntoServizio } from "@/lib/anagrafiche-data";

interface ServiceRequest {
  id: string;
  type: string;
  client_id?: string | null;
  service_point_id?: string | null;
  start_date: string;
  start_time?: string | null;
  end_date: string;
  end_time?: string | null;
  status: "Pending" | "Approved" | "Rejected" | "Completed";
  calculated_cost?: number | null;
  multiplier?: number | null; // Added multiplier field
  num_agents?: number | null;
  cadence_hours?: number | null;
  inspection_type?: string | null;
  daily_hours_config?: any | null;
  fornitore_id?: string | null;

  clienti?: { nome_cliente: string } | null;
  punti_servizio?: { nome_punto_servizio: string; id_cliente: string | null } | null;
}

interface UseServiceRequestsResult {
  data: ServiceRequest[];
  loading: boolean;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  startDateFilter: Date | undefined;
  setStartDateFilter: (date: Date | undefined) => void;
  endDateFilter: Date | undefined;
  setEndDateFilter: (date: Date | undefined) => void;
  fetchServices: () => Promise<void>;
  handleResetFilters: () => void;
  puntiServizioMap: Map<string, PuntoServizio & { nome_cliente?: string }>;
}

export function useServiceRequests(): UseServiceRequestsResult {
  const [data, setData] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDateFilter, setStartDateFilter] = useState<Date | undefined>(undefined);
  const [endDateFilter, setEndDateFilter] = useState<Date | undefined>(undefined);
  const [puntiServizioMap, setPuntiServizioMap] = useState<Map<string, PuntoServizio & { nome_cliente?: string }>>(new Map());

  const fetchServices = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('servizi_richiesti')
      .select('id, type, client_id, service_point_id, fornitore_id, start_date, start_time, end_date, end_time, status, num_agents, cadence_hours, inspection_type, daily_hours_config, clienti(nome_cliente), punti_servizio(nome_punto_servizio, id_cliente)');

    if (startDateFilter) {
      query = query.gte('start_date', format(startDateFilter, 'yyyy-MM-dd'));
    }
    if (endDateFilter) {
      query = query.lte('end_date', format(endDateFilter, 'yyyy-MM-dd'));
    }

    const { data: servicesData, error } = await query;

    if (error) {
      showError(`Errore nel recupero dei servizi: ${error.message}`);
      console.error("Error fetching services:", error);
      setData([]);
    } else {
      const servicesWithCalculatedCost = await Promise.all(servicesData.map(async (service) => {
        const serviceStartDate = parseISO(service.start_date);
        const serviceEndDate = parseISO(service.end_date);

        const costDetails = {
          type: service.type,
          client_id: service.client_id,
          service_point_id: service.service_point_id,
          fornitore_id: service.fornitore_id,
          start_date: serviceStartDate,
          end_date: serviceEndDate,
          start_time: service.start_time,
          end_time: service.end_time,
          num_agents: service.num_agents,
          cadence_hours: service.cadence_hours,
          daily_hours_config: service.daily_hours_config,
          inspection_type: service.inspection_type,
        };
        const calculatedRates = await calculateServiceCost(costDetails);
        return { 
          ...service, 
          calculated_cost: calculatedRates ? (calculatedRates.multiplier * calculatedRates.clientRate) : null,
          multiplier: calculatedRates ? calculatedRates.multiplier : null, // Store the multiplier
        };
      }));
      setData(servicesWithCalculatedCost || []);
    }
    setLoading(false);
  }, [startDateFilter, endDateFilter]);

  const fetchAnagraficheMaps = useCallback(async () => {
    const fetchedPuntiServizio = await supabase
      .from('punti_servizio')
      .select('id, nome_punto_servizio, id_cliente, clienti(nome_cliente)');

    if (fetchedPuntiServizio.error) {
      console.error("Error fetching punti_servizio for map:", fetchedPuntiServizio.error);
      return;
    }

    const psMap = new Map<string, PuntoServizio & { nome_cliente?: string }>();
    fetchedPuntiServizio.data.forEach(ps => {
      psMap.set(ps.id, {
        ...ps,
        nome_cliente: ps.clienti?.nome_cliente || 'N/A'
      });
    });
    setPuntiServizioMap(psMap);
  }, []);

  useEffect(() => {
    fetchServices();
    fetchAnagraficheMaps();
  }, [fetchServices, fetchAnagraficheMaps]);

  const handleResetFilters = useCallback(() => {
    setSearchTerm("");
    setStartDateFilter(undefined);
    setEndDateFilter(undefined);
  }, []);

  return {
    data,
    loading,
    searchTerm,
    setSearchTerm,
    startDateFilter,
    setStartDateFilter,
    endDateFilter,
    setEndDateFilter,
    fetchServices,
    handleResetFilters,
    puntiServizioMap,
  };
}