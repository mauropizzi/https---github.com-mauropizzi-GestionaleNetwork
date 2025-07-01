import { useState, useEffect, useCallback, useMemo } from "react";
import { format, parseISO, startOfMonth, endOfMonth } from "date-fns";
import { it } from 'date-fns/locale';
import {
  fetchClienti,
  fetchPuntiServizio,
  fetchServiceRequestsForAnalysis,
  fetchAllTariffe,
  calculateServiceCost
} from "@/lib/data-fetching";
import { showError } from "@/utils/toast";
import { Cliente, PuntoServizio } from "@/lib/anagrafiche-data";

interface ServiceSummary {
  servicePointId: string;
  servicePointName: string;
  totalServices: number;
  totalHours: number;
  totalClientCost: number;
  totalSupplierCost: number;
  costDelta: number;
}

interface MissingTariffEntry {
  serviceId: string;
  serviceType: string;
  clientName: string;
  servicePointName?: string;
  startDate: string;
  reason: string;
}

export const useAnalisiContabileData = () => {
  const [clientsList, setClientsList] = useState<Cliente[]>([]);
  const [puntiServizioMap, setPuntiServizioMap] = useState<Map<string, PuntoServizio>>(new Map());
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [summaryData, setSummaryData] = useState<ServiceSummary[]>([]);
  const [missingTariffs, setMissingTariffs] = useState<MissingTariffEntry[]>([]);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingMissingTariffs, setLoadingMissingTariffs] = useState(true);

  const [startDateFilter, setStartDateFilter] = useState<Date | undefined>(startOfMonth(new Date()));
  const [endDateFilter, setEndDateFilter] = useState<Date | undefined>(endOfMonth(new Date()));

  // Fetch initial data: clients and service points
  useEffect(() => {
    const loadInitialData = async () => {
      setLoadingSummary(true);
      setLoadingMissingTariffs(true);
      try {
        const fetchedClients = await fetchClienti();
        setClientsList(fetchedClients);

        const fetchedPuntiServizio = await fetchPuntiServizio();
        const psMap = new Map<string, PuntoServizio>();
        fetchedPuntiServizio.forEach(ps => psMap.set(ps.id, ps));
        setPuntiServizioMap(psMap);

        if (fetchedClients.length > 0) {
          setSelectedClientId(fetchedClients[0].id);
        } else {
          setSelectedClientId(null);
        }
      } catch (err) {
        showError("Errore nel caricamento dei dati iniziali.");
        console.error("Error loading initial data:", err);
      } finally {
        setLoadingSummary(false);
        setLoadingMissingTariffs(false);
      }
    };
    loadInitialData();
  }, []);

  // Fetch and process service data for summary based on selected client and date filters
  const fetchAndProcessServiceData = useCallback(async () => {
    setLoadingSummary(true);
    try {
      const rawServices = await fetchServiceRequestsForAnalysis(
        selectedClientId || undefined,
        startDateFilter ? format(startDateFilter, 'yyyy-MM-dd') : undefined,
        endDateFilter ? format(endDateFilter, 'yyyy-MM-dd') : undefined
      );

      const summary: { [key: string]: ServiceSummary } = {};

      for (const service of rawServices) {
        const servicePoint = puntiServizioMap.get(service.service_point_id);
        if (servicePoint) {
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

          if (!summary[servicePoint.id]) {
            summary[servicePoint.id] = {
              servicePointId: servicePoint.id,
              servicePointName: servicePoint.nome_punto_servizio,
              totalServices: 0,
              totalHours: 0,
              totalClientCost: 0,
              totalSupplierCost: 0,
              costDelta: 0,
            };
          }
          summary[servicePoint.id].totalServices += 1;
          if (calculatedRates) {
            const clientCost = calculatedRates.multiplier * calculatedRates.clientRate;
            const supplierCost = calculatedRates.multiplier * calculatedRates.supplierRate;
            
            summary[servicePoint.id].totalHours += calculatedRates.multiplier;
            summary[servicePoint.id].totalClientCost += clientCost;
            summary[servicePoint.id].totalSupplierCost += supplierCost;
            summary[servicePoint.id].costDelta += (clientCost - supplierCost);
          }
        }
      }

      setSummaryData(Object.values(summary));
    } catch (err) {
      showError("Errore nel recupero o nell'elaborazione dei dati dei servizi.");
      console.error("Error fetching or processing service data:", err);
      setSummaryData([]);
    } finally {
      setLoadingSummary(false);
    }
  }, [selectedClientId, startDateFilter, endDateFilter, puntiServizioMap]);

  // Fetch and identify missing tariffs
  const fetchAndIdentifyMissingTariffs = useCallback(async () => {
    setLoadingMissingTariffs(true);
    try {
      const allServices = await fetchServiceRequestsForAnalysis(
        undefined,
        startDateFilter ? format(startDateFilter, 'yyyy-MM-dd') : undefined,
        endDateFilter ? format(endDateFilter, 'yyyy-MM-dd') : undefined
      );
      const allClients = await fetchClienti();

      const clientNameMap = new Map(allClients.map(c => [c.id, c.nome_cliente]));
      const servicePointNameMap = new Map(Array.from(puntiServizioMap.values()).map(ps => [ps.id, ps.nome_punto_servizio]));

      const identifiedMissingTariffs: MissingTariffEntry[] = [];

      for (const service of allServices) {
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

        if (calculatedRates === null) {
          identifiedMissingTariffs.push({
            serviceId: service.id,
            serviceType: service.type,
            clientName: clientNameMap.get(service.client_id) || 'Cliente Sconosciuto',
            servicePointName: servicePointNameMap.get(service.service_point_id) || 'Punto Servizio Sconosciuto',
            startDate: format(serviceStartDate, 'PPP', { locale: it }),
            reason: "Nessuna tariffa corrispondente trovata per il periodo e il tipo di servizio.",
          });
        }
      }
      setMissingTariffs(identifiedMissingTariffs);
    } catch (err) {
      showError("Errore nel recupero o nell'identificazione delle tariffe mancanti.");
      console.error("Error fetching or identifying missing tariffs:", err);
      setMissingTariffs([]);
    } finally {
      setLoadingMissingTariffs(false);
    }
  }, [startDateFilter, endDateFilter, puntiServizioMap]);

  useEffect(() => {
    if (puntiServizioMap.size > 0 || clientsList.length > 0) {
      fetchAndProcessServiceData();
      fetchAndIdentifyMissingTariffs();
    }
  }, [selectedClientId, puntiServizioMap, clientsList, fetchAndProcessServiceData, fetchAndIdentifyMissingTariffs]);

  const handleResetFilters = useCallback(() => {
    setStartDateFilter(startOfMonth(new Date()));
    setEndDateFilter(endOfMonth(new Date()));
  }, []);

  return {
    clientsList,
    selectedClientId,
    setSelectedClientId,
    summaryData,
    missingTariffs,
    loadingSummary,
    loadingMissingTariffs,
    startDateFilter,
    setStartDateFilter,
    endDateFilter,
    setEndDateFilter,
    fetchAndProcessServiceData,
    fetchAndIdentifyMissingTariffs,
    handleResetFilters,
  };
};