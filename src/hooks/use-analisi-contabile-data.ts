import React, { useState, useEffect, useCallback, useMemo } from "react"; // Aggiunto import di React
import { format, parseISO, startOfMonth, endOfMonth, isValid } from "date-fns"; // Aggiunto isValid
import { it } from 'date-fns/locale';
import {
  fetchClienti,
  fetchPuntiServizio,
  fetchServiceRequestsForAnalysis,
  fetchServiziCanoneForAnalysis,
  fetchAllTariffe,
  calculateServiceCost
} from "@/lib/data-fetching";
import { showError } from "@/utils/toast";
import { Cliente, PuntoServizio } from "@/lib/anagrafiche-data";

interface ServiceSummary {
  servicePointId: string;
  servicePointName: string;
  serviceType: string;
  totalServices: number;
  totalHours: number; // This will now represent total units (hours, interventions, months)
  totalClientCost: number;
  totalSupplierCost: number;
  costDelta: number;
}

interface MissingTariffEntry {
  serviceId: string;
  serviceType: string;
  clientName: string;
  clientId: string;
  servicePointName?: string;
  servicePointId?: string;
  fornitoreId?: string;
  startDate: string;
  endDate: string;
  reason: string;
}

export const useAnalisiContabileData = () => {
  console.log("useAnalisiContabileData: Hook function entered."); // Nuovo log
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
    console.log("useAnalisiContabileData: useEffect for initial data running."); // Nuovo log
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
    console.log("useAnalisiContabileData: fetchAndProcessServiceData called."); // Nuovo log
    setLoadingSummary(true);
    try {
      const formattedStartDate = startDateFilter ? format(startDateFilter, 'yyyy-MM-dd') : undefined;
      const formattedEndDate = endDateFilter ? format(endDateFilter, 'yyyy-MM-dd') : undefined;

      const rawServicesRichiesti = await fetchServiceRequestsForAnalysis(
        selectedClientId || undefined,
        formattedStartDate,
        formattedEndDate
      );

      const rawServiziCanone = await fetchServiziCanoneForAnalysis(
        selectedClientId || undefined,
        formattedStartDate,
        formattedEndDate
      );

      // Combine and normalize services
      const allServices = [
        ...rawServicesRichiesti.map(s => ({
          id: s.id,
          type: s.type,
          client_id: s.client_id,
          service_point_id: s.service_point_id,
          fornitore_id: s.fornitore_id,
          start_date: s.start_date,
          end_date: s.end_date,
          start_time: s.start_time,
          end_time: s.end_time,
          num_agents: s.num_agents,
          cadence_hours: s.cadence_hours,
          daily_hours_config: s.daily_hours_config,
          inspection_type: s.inspection_type,
        })),
        ...rawServiziCanone.map(sc => ({
          id: sc.id,
          type: sc.tipo_canone, // Map tipo_canone to type for consistent processing
          client_id: sc.client_id,
          service_point_id: sc.service_point_id,
          fornitore_id: sc.fornitore_id,
          start_date: sc.start_date,
          end_date: sc.end_date,
          start_time: null, // Not applicable for monthly
          end_time: null, // Not applicable for monthly
          num_agents: null,
          cadence_hours: null,
          daily_hours_config: null,
          inspection_type: null,
        })),
      ];
      console.log("fetchAndProcessServiceData: allServices (combined) =", allServices); // Nuovo log

      const summary: { [key: string]: ServiceSummary } = {};

      for (const service of allServices) {
        const servicePoint = puntiServizioMap.get(service.service_point_id);
        if (servicePoint) {
          // Ensure dates are valid Date objects before passing to calculateServiceCost
          const serviceStartDate = (service.start_date && typeof service.start_date === 'string' && isValid(parseISO(service.start_date)))
            ? parseISO(service.start_date)
            : new Date(); // Fallback to current date if invalid
          const serviceEndDate = (service.end_date && typeof service.end_date === 'string' && isValid(parseISO(service.end_date)))
            ? parseISO(service.end_date)
            : serviceStartDate; // Fallback to start date if invalid

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

          const summaryKey = `${servicePoint.id}_${service.type}`; // Group by service point and type
          if (!summary[summaryKey]) {
            summary[summaryKey] = {
              servicePointId: servicePoint.id,
              servicePointName: servicePoint.nome_punto_servizio,
              serviceType: service.type, // Set service type
              totalServices: 0,
              totalHours: 0,
              totalClientCost: 0,
              totalSupplierCost: 0,
              costDelta: 0,
            };
          }
          summary[summaryKey].totalServices += 1;
          if (calculatedRates) {
            const clientCost = calculatedRates.multiplier * calculatedRates.clientRate;
            const supplierCost = calculatedRates.multiplier * calculatedRates.supplierRate;
            
            summary[summaryKey].totalHours += calculatedRates.multiplier;
            summary[summaryKey].totalClientCost += clientCost;
            summary[summaryKey].totalSupplierCost += supplierCost;
            summary[summaryKey].costDelta += (clientCost - supplierCost);
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
    console.log("useAnalisiContabileData: fetchAndIdentifyMissingTariffs called."); // Nuovo log
    setLoadingMissingTariffs(true);
    try {
      const formattedStartDate = startDateFilter ? format(startDateFilter, 'yyyy-MM-dd') : undefined;
      const formattedEndDate = endDateFilter ? format(endDateFilter, 'yyyy-MM-dd') : undefined;

      const allServicesRichiesti = await fetchServiceRequestsForAnalysis(
        undefined,
        formattedStartDate,
        formattedEndDate
      );
      const allServiziCanone = await fetchServiziCanoneForAnalysis(
        undefined,
        formattedStartDate,
        formattedEndDate
      );

      const allServices = [
        ...allServicesRichiesti.map(s => ({
          id: s.id,
          type: s.type,
          client_id: s.client_id,
          service_point_id: s.service_point_id,
          fornitore_id: s.fornitore_id,
          start_date: s.start_date,
          end_date: s.end_date,
          start_time: s.start_time,
          end_time: s.end_time,
          num_agents: s.num_agents,
          cadence_hours: s.cadence_hours,
          daily_hours_config: s.daily_hours_config,
          inspection_type: s.inspection_type,
        })),
        ...rawServiziCanone.map(sc => ({
          id: sc.id,
          type: sc.tipo_canone, // Map tipo_canone to type for consistent processing
          client_id: sc.client_id,
          service_point_id: sc.service_point_id,
          fornitore_id: sc.fornitore_id,
          start_date: sc.start_date,
          end_date: sc.end_date,
          start_time: null,
          end_time: null,
          num_agents: null,
          cadence_hours: null,
          daily_hours_config: null,
          inspection_type: null,
        })),
      ];
      console.log("fetchAndIdentifyMissingTariffs: allServices (combined) =", allServices); // Nuovo log

      const allClients = await fetchClienti();

      const clientNameMap = new Map(allClients.map(c => [c.id, c.nome_cliente]));
      const servicePointNameMap = new Map(Array.from(puntiServizioMap.values()).map(ps => [ps.id, ps.nome_punto_servizio]));

      const identifiedMissingTariffs: MissingTariffEntry[] = [];

      for (const service of allServices) {
        // Ensure dates are valid Date objects before passing to calculateServiceCost
        const serviceStartDate = (service.start_date && typeof service.start_date === 'string' && isValid(parseISO(service.start_date)))
          ? parseISO(service.start_date)
          : new Date(); // Fallback to current date if invalid
        const serviceEndDate = (service.end_date && typeof service.end_date === 'string' && isValid(parseISO(service.end_date)))
          ? parseISO(service.end_date)
          : serviceStartDate; // Fallback to start date if invalid

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

        if (calculatedRates === null) { // THIS IS THE KEY CONDITION
          console.log("Missing tariff identified for service:", service); // Nuovo log
          identifiedMissingTariffs.push({
            serviceId: service.id,
            serviceType: service.type,
            clientName: clientNameMap.get(service.client_id) || 'Cliente Sconosciuto',
            clientId: service.client_id,
            servicePointName: servicePointNameMap.get(service.service_point_id) || 'Punto Servizio Sconosciuto',
            servicePointId: service.service_point_id,
            fornitoreId: service.fornitore_id,
            startDate: isValid(serviceStartDate) ? format(serviceStartDate, 'yyyy-MM-dd') : 'N/A', // Ensure valid date for formatting
            endDate: isValid(serviceEndDate) ? format(serviceEndDate, 'yyyy-MM-dd') : 'N/A',     // Ensure valid date for formatting
            reason: "Nessuna tariffa corrispondente trovata per il periodo e il tipo di servizio.",
          });
        }
      }
      setMissingTariffs(identifiedMissingTariffs);
    }
    catch (err) { // THIS CATCH BLOCK TRIGGERS THE TOAST
      showError("Errore nel recupero o nell'identificazione delle tariffe mancanti.");
      console.error("Error fetching or identifying missing tariffs:", err);
      setMissingTariffs([]);
    } finally {
      setLoadingMissingTariffs(false);
    }
  }, [startDateFilter, endDateFilter, puntiServizioMap]);

  const handleResetFilters = useCallback(() => {
    setStartDateFilter(startOfMonth(new Date()));
    setEndDateFilter(endOfMonth(new Date()));
    setSelectedClientId(null); // Reset client filter
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