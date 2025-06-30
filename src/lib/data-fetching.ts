import { supabase } from "@/integrations/supabase/client";
import { Cliente, Fornitore, PuntoServizio, Personale, OperatoreNetwork, Procedure } from "@/lib/anagrafiche-data";
import { showError } from "@/utils/toast";
import { format, parseISO, isValid, addDays, isWeekend, differenceInHours, differenceInMinutes } from "date-fns";
import { it } from 'date-fns/locale';
import { isDateHoliday } from "@/lib/date-utils";

export async function fetchClienti(): Promise<Cliente[]> {
  const { data, error } = await supabase
    .from('clienti')
    .select('id, nome_cliente');

  if (error) {
    showError(`Errore nel recupero dei clienti: ${error.message}`);
    console.error("Error fetching clienti:", error);
    return [];
  }
  return data || [];
}

export async function fetchFornitori(): Promise<Fornitore[]> {
  const { data, error } = await supabase
    .from('fornitori')
    .select('id, nome_fornitore');

  if (error) {
    showError(`Errore nel recupero dei fornitori: ${error.message}`);
    console.error("Error fetching fornitori:", error);
    return [];
  }
  return data || [];
}

export async function fetchPuntiServizio(): Promise<PuntoServizio[]> {
  const { data, error } = await supabase
    .from('punti_servizio')
    .select('*, procedure(*)'); // Include tutti i dettagli della procedura

  if (error) {
    showError(`Errore nel recupero dei punti servizio: ${error.message}`);
    console.error("Error fetching punti_servizio:", error);
    return [];
  }
  return data || [];
}

export async function fetchPersonale(role?: string): Promise<Personale[]> {
  console.log(`Attempting to fetch personnel with role: '${role}'`);
  let query = supabase
    .from('personale')
    .select('id, nome, cognome, ruolo, telefono'); // Added 'telefono' here

  if (role) {
    query = query.eq('ruolo', role);
  }

  const { data, error } = await query;

  if (error) {
    showError(`Errore nel recupero del personale: ${error.message}`);
    console.error("Error fetching personale:", error);
    return [];
  }
  console.log(`Successfully fetched personnel for role '${role}':`, data);
  return data || [];
}

export async function fetchOperatoriNetwork(): Promise<OperatoreNetwork[]> {
  const { data, error } = await supabase
    .from('operatori_network')
    .select('id, nome, cognome, telefono, email, client_id');

  if (error) {
    showError(`Errore nel recupero degli operatori network: ${error.message}`);
    console.error("Error fetching operatori_network:", error);
    return [];
  }
  return data || [];
}

export async function fetchMonthlyTariffe(): Promise<{ id: string; service_type: string; }[]> {
  const { data, error } = await supabase
    .from('tariffe')
    .select('id, service_type')
    .eq('unita_misura', 'mese'); // Filter for monthly rates

  if (error) {
    showError(`Errore nel recupero delle tariffe mensili: ${error.message}`);
    console.error("Error fetching monthly tariffe:", error);
    return [];
  }
  return data || [];
}

export async function fetchProcedure(): Promise<Procedure[]> {
  const { data, error } = await supabase
    .from('procedure')
    .select('id, nome_procedura'); // Only need ID and name for select options

  if (error) {
    showError(`Errore nel recupero delle procedure: ${error.message}`);
    console.error("Error fetching procedure:", error);
    return [];
  }
  return data || [];
}

export async function fetchServiceRequestsForAnalysis(clientId?: string, startDate?: string, endDate?: string): Promise<any[]> {
  let query = supabase
    .from('servizi_richiesti')
    .select('id, type, client_id, service_point_id, fornitore_id, start_date, end_date, start_time, end_time, num_agents, cadence_hours, inspection_type, daily_hours_config'); // Fetch all relevant fields, including fornitore_id

  if (clientId) {
    query = query.eq('client_id', clientId);
  }
  if (startDate) {
    query = query.gte('start_date', startDate);
  }
  if (endDate) {
    query = query.lte('end_date', endDate);
  }

  const { data, error } = await query;

  if (error) {
    showError(`Errore nel recupero dei servizi per analisi: ${error.message}`);
    console.error("Error fetching service requests for analysis:", error);
    return [];
  }
  return data || [];
}

export async function fetchAllTariffe(): Promise<any[]> {
  const { data, error } = await supabase
    .from('tariffe')
    .select('id, client_id, service_type, punto_servizio_id, fornitore_id, data_inizio_validita, data_fine_validita, client_rate, unita_misura'); // Fetch client_rate and unita_misura

  if (error) {
    showError(`Errore nel recupero di tutte le tariffe: ${error.message}`);
    console.error("Error fetching all tariffe:", error);
    return [];
  }
  return data || [];
}

interface ServiceDetailsForCost {
  type: string;
  client_id: string;
  service_point_id?: string | null;
  fornitore_id?: string | null;
  start_date: Date;
  end_date: Date;
  start_time?: string | null;
  end_time?: string | null;
  num_agents?: number | null;
  cadence_hours?: number | null;
  daily_hours_config?: any | null;
  inspection_type?: string | null;
}

export async function calculateServiceCost(details: ServiceDetailsForCost): Promise<number | null> {
  const allTariffe = await fetchAllTariffe();

  const serviceStartDate = details.start_date;

  const matchingTariffs = allTariffe.filter(tariff => {
    const tariffStartDate = parseISO(tariff.data_inizio_validita);
    const tariffEndDate = tariff.data_fine_validita ? parseISO(tariff.data_fine_validita) : new Date(9999, 11, 31); // Far future date if no end date

    const isTariffActive = serviceStartDate >= tariffStartDate && serviceStartDate <= tariffEndDate;

    return (
      tariff.client_id === details.client_id &&
      tariff.service_type === details.type &&
      isTariffActive &&
      (tariff.punto_servizio_id === details.service_point_id || tariff.punto_servizio_id === null) &&
      (tariff.fornitore_id === details.fornitore_id || tariff.fornitore_id === null)
    );
  });

  if (matchingTariffs.length === 0) {
    console.warn(`Nessuna tariffa trovata per il servizio di tipo '${details.type}' per il cliente '${details.client_id}' e punto servizio '${details.service_point_id}' nel periodo specificato.`);
    return null;
  }

  // Prioritize tariffs: specific service point > specific supplier > general client
  // Then, if multiple, pick the one with the latest start date (most recent)
  const sortedTariffs = matchingTariffs.sort((a, b) => {
    // Prioritize by service point specificity
    if (a.punto_servizio_id && !b.punto_servizio_id) return -1;
    if (!a.punto_servizio_id && b.punto_servizio_id) return 1;

    // Then by supplier specificity
    if (a.fornitore_id && !b.fornitore_id) return -1;
    if (!a.fornitore_id && b.fornitore_id) return 1;

    // Then by latest start date
    const dateA = parseISO(a.data_inizio_validita);
    const dateB = parseISO(b.data_inizio_validita);
    return dateB.getTime() - dateA.getTime();
  });

  const selectedTariff = sortedTariffs[0];

  let calculatedCost: number | null = null;

  switch (details.type) {
    case "Piantonamento":
    case "Servizi Fiduciari": {
      if (selectedTariff.unita_misura === "ora") {
        let totalHours = 0;
        let currentDate = new Date(details.start_date);
        const endDate = details.end_date;

        while (currentDate <= endDate) {
          const dayOfWeek = format(currentDate, 'EEEE', { locale: it });
          const isCurrentDayHoliday = isDateHoliday(currentDate);

          let dayConfig;
          if (isCurrentDayHoliday) {
            dayConfig = details.daily_hours_config?.find((d: any) => d.day === "Festivi");
          } else if (dayOfWeek === "sabato") {
            dayConfig = details.daily_hours_config?.find((d: any) => d.day === "Sabato");
          } else if (dayOfWeek === "domenica") {
            dayConfig = details.daily_hours_config?.find((d: any) => d.day === "Domenica");
          } else {
            dayConfig = details.daily_hours_config?.find((d: any) => d.day === dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1));
          }

          if (dayConfig) {
            if (dayConfig.is24h) {
              totalHours += 24;
            } else if (dayConfig.startTime && dayConfig.endTime) {
              const startOfDay = parseISO(format(currentDate, 'yyyy-MM-dd') + 'T' + dayConfig.startTime + ':00');
              const endOfDay = parseISO(format(currentDate, 'yyyy-MM-dd') + 'T' + dayConfig.endTime + ':00');
              
              if (isValid(startOfDay) && isValid(endOfDay)) {
                let dailyDiffMs = endOfDay.getTime() - startOfDay.getTime();
                if (dailyDiffMs < 0) { // Handle overnight shifts
                  dailyDiffMs += 24 * 60 * 60 * 1000;
                }
                totalHours += dailyDiffMs / (1000 * 60 * 60);
              }
            }
          }
          currentDate = addDays(currentDate, 1);
        }
        calculatedCost = totalHours * (details.num_agents || 1) * selectedTariff.client_rate;
      } else {
        console.warn(`Unità di misura '${selectedTariff.unita_misura}' non supportata per ${details.type}.`);
        calculatedCost = null;
      }
      break;
    }
    case "Ispezioni": {
      if (selectedTariff.unita_misura === "intervento") {
        let totalOperationalHours = 0;
        let currentDate = new Date(details.start_date);
        const endDate = details.end_date;

        while (currentDate <= endDate) {
          const dayOfWeek = format(currentDate, 'EEEE', { locale: it });
          const isCurrentDayHoliday = isDateHoliday(currentDate);

          let dayConfig;
          if (isCurrentDayHoliday) {
            dayConfig = details.daily_hours_config?.find((d: any) => d.day === "Festivi");
          } else if (dayOfWeek === "sabato") {
            dayConfig = details.daily_hours_config?.find((d: any) => d.day === "Sabato");
          } else if (dayOfWeek === "domenica") {
            dayConfig = details.daily_hours_config?.find((d: any) => d.day === "Domenica");
          } else {
            dayConfig = details.daily_hours_config?.find((d: any) => d.day === dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1));
          }

          if (dayConfig) {
            if (dayConfig.is24h) {
              totalOperationalHours += 24;
            } else if (dayConfig.startTime && dayConfig.endTime) {
              const startOfDay = parseISO(format(currentDate, 'yyyy-MM-dd') + 'T' + dayConfig.startTime + ':00');
              const endOfDay = parseISO(format(currentDate, 'yyyy-MM-dd') + 'T' + dayConfig.endTime + ':00');
              
              if (isValid(startOfDay) && isValid(endOfDay)) {
                let dailyDiffMs = endOfDay.getTime() - startOfDay.getTime();
                if (dailyDiffMs < 0) { // Handle overnight shifts
                  dailyDiffMs += 24 * 60 * 60 * 1000;
                }
                totalOperationalHours += dailyDiffMs / (1000 * 60 * 60);
              }
            }
          }
          currentDate = addDays(currentDate, 1);
        }

        if (details.cadence_hours && details.cadence_hours > 0) {
          const numInspections = Math.floor(totalOperationalHours / details.cadence_hours) + 1;
          calculatedCost = numInspections * selectedTariff.client_rate;
        } else {
          console.warn("Cadenza oraria non valida per il calcolo delle ispezioni.");
          calculatedCost = null;
        }
      } else {
        console.warn(`Unità di misura '${selectedTariff.unita_misura}' non supportata per ${details.type}.`);
        calculatedCost = null;
      }
      break;
    }
    case "Bonifiche":
    case "Gestione Chiavi":
    case "Apertura/Chiusura":
    case "Intervento": {
      if (selectedTariff.unita_misura === "intervento") {
        calculatedCost = selectedTariff.client_rate; // Fixed cost per intervention
      } else {
        console.warn(`Unità di misura '${selectedTariff.unita_misura}' non supportata per ${details.type}.`);
        calculatedCost = null;
      }
      break;
    }
    default:
      console.warn(`Tipo di servizio '${details.type}' non riconosciuto per il calcolo del costo.`);
      calculatedCost = null;
  }

  return calculatedCost;
}