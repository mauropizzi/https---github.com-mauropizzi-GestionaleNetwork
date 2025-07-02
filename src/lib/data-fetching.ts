import { supabase } from "@/integrations/supabase/client";
import { Cliente, Fornitore, PuntoServizio, Personale, OperatoreNetwork, Procedure } from "@/lib/anagrafiche-data";
import { showError } from "@/utils/toast";
import { format, parseISO, isValid, addDays, isWeekend, differenceInHours, differenceInMinutes, differenceInMonths, addMonths } from "date-fns";
import { it } from 'date-fns/locale';
import { isDateHoliday } from "@/lib/date-utils";

let cachedTariffe: any[] | null = null;
let lastTariffeFetchTime: number = 0;
const TARIFEE_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function invalidateTariffeCache() {
  cachedTariffe = null;
  lastTariffeFetchTime = 0;
  console.log("Tariffs cache invalidated.");
}

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

export async function fetchServiziCanoneForAnalysis(clientId?: string, startDate?: string, endDate?: string): Promise<any[]> {
  let query = supabase
    .from('servizi_canone')
    .select('id, tipo_canone, client_id, service_point_id, fornitore_id, start_date, end_date, unita_misura'); // Select relevant fields

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
    showError(`Errore nel recupero dei servizi a canone per analisi: ${error.message}`);
    console.error("Error fetching servizi_canone for analysis:", error);
    return [];
  }
  return data || [];
}

export async function fetchAllTariffe(): Promise<any[]> {
  const now = Date.now();
  if (cachedTariffe && (now - lastTariffeFetchTime < TARIFEE_CACHE_DURATION)) {
    console.log("Using cached tariffs.");
    return cachedTariffe;
  }

  console.log("Fetching tariffs from Supabase...");
  const { data, error } = await supabase
    .from('tariffe')
    .select('id, client_id, service_type, punto_servizio_id, fornitore_id, data_inizio_validita, data_fine_validita, client_rate, supplier_rate, unita_misura'); // Fetch client_rate and unita_misura

  if (error) {
    showError(`Errore nel recupero di tutte le tariffe: ${error.message}`);
    console.error("Error fetching all tariffe:", error);
    return [];
  }
  cachedTariffe = data || [];
  lastTariffeFetchTime = now;
  console.log("Fetched and cached tariffs.");
  return cachedTariffe;
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

export async function calculateServiceMultiplier(details: ServiceDetailsForCost): Promise<number | null> {
  console.log("calculateServiceMultiplier: details.type =", details.type);
  let multiplier: number | null = null;

  switch (details.type) {
    case "Piantonamento":
    case "Servizi Fiduciari": {
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
          const italianDayName = dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1);
          dayConfig = details.daily_hours_config?.find((d: any) => d.day === italianDayName);
        }
        
        if (dayConfig) {
          if (dayConfig.is24h) {
            totalHours += 24;
          } else if (dayConfig.startTime && dayConfig.endTime) {
            const startOfDay = parseISO(`${format(currentDate, 'yyyy-MM-dd')}T${dayConfig.startTime}:00`);
            const endOfDay = parseISO(`${format(currentDate, 'yyyy-MM-dd')}T${dayConfig.endTime}:00`);
            
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
      multiplier = totalHours * (details.num_agents || 1);
      break;
    }
    case "Ispezioni": {
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
          const italianDayName = dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1);
          dayConfig = details.daily_hours_config?.find((d: any) => d.day === italianDayName);
        }
        
        if (dayConfig) {
          if (dayConfig.is24h) {
            totalOperationalHours += 24;
          } else if (dayConfig.startTime && dayConfig.endTime) {
            const startOfDay = parseISO(`${format(currentDate, 'yyyy-MM-dd')}T${dayConfig.startTime}:00`);
            const endOfDay = parseISO(`${format(currentDate, 'yyyy-MM-dd')}T${dayConfig.endTime}:00`);
            
            if (isValid(startOfDay) && isValid(endOfDay)) {
              let dailyDiffMs = endOfDay.getTime() - startOfDay.getTime();
              if (dailyDiffMs < 0) {
                dailyDiffMs += 24 * 60 * 60 * 1000;
              }
              totalOperationalHours += dailyDiffMs / (1000 * 60 * 60);
            }
          }
        }
        currentDate = addDays(currentDate, 1);
      }

      if (details.cadence_hours && details.cadence_hours > 0) {
        multiplier = Math.floor(totalOperationalHours / details.cadence_hours) + 1;
      } else {
        multiplier = null;
      }
      break;
    }
    case "Bonifiche":
    case "Gestione Chiavi":
    case "Apertura/Chiusura":
    case "Intervento": {
      multiplier = 1;
      break;
    }
    // New case for monthly subscription services
    case "Disponibilità Pronto Intervento":
    case "Videosorveglianza":
    case "Impianto Allarme": // <--- This is the type for the missing tariff service
    case "Bidirezionale":
    case "Monodirezionale":
    case "Tenuta Chiavi": { // <--- This is the type for the existing tariff service
      // Calculate number of months between start_date and end_date
      // If end_date is not provided, assume it's an ongoing service for 1 month for calculation purposes
      const endDate = details.end_date || addMonths(details.start_date, 1);
      let months = differenceInMonths(endDate, details.start_date);
      // If there's any partial month, count it as a full month
      if (months === 0 && details.start_date.getDate() !== endDate.getDate()) {
          months = 1;
      } else if (months > 0 && endDate.getDate() > details.start_date.getDate()) {
          months += 1; // Add 1 for the partial month at the end
      }
      multiplier = Math.max(1, months); // Ensure at least 1 month
      break;
    }
    default:
      console.warn(`calculateServiceMultiplier: Tipo di servizio non riconosciuto: ${details.type}`);
      multiplier = null;
  }

  return multiplier;
}

export async function calculateServiceCost(details: ServiceDetailsForCost): Promise<{ multiplier: number; clientRate: number; supplierRate: number } | null> {
  console.log("calculateServiceCost: details =", details);
  const allTariffe = await fetchAllTariffe();
  console.log("calculateServiceCost: allTariffe (first 5) =", allTariffe.slice(0, 5)); // Log a sample of tariffs
  const serviceStartDate = details.start_date;

  const matchingTariffs = allTariffe.filter(tariff => {
    // Ensure data_inizio_validita and data_fine_validita are strings before parsing
    const tariffStartDate = (typeof tariff.data_inizio_validita === 'string' && tariff.data_inizio_validita !== '')
      ? parseISO(tariff.data_inizio_validita)
      : new Date(0); // Default to epoch start if null or empty string
    const tariffEndDate = (typeof tariff.data_fine_validita === 'string' && tariff.data_fine_validita !== '')
      ? parseISO(tariff.data_fine_validita)
      : new Date(9999, 11, 31); // Default to far future if null or empty string

    const isTariffActive = serviceStartDate >= tariffStartDate && serviceStartDate <= tariffEndDate;
    const clientMatch = tariff.client_id === details.client_id;
    const typeMatch = tariff.service_type === details.type;
    const servicePointMatch = (tariff.punto_servizio_id === details.service_point_id || tariff.punto_servizio_id === null);
    const fornitoreMatch = (tariff.fornitore_id === details.fornitore_id || tariff.fornitore_id === null);

    const matchResult = clientMatch && typeMatch && isTariffActive && servicePointMatch && fornitoreMatch;
    if (!matchResult) {
        console.log(`  Tariff mismatch for service ${details.type} (client: ${details.client_id}, sp: ${details.service_point_id}, forn: ${details.fornitore_id}, date: ${format(serviceStartDate, 'yyyy-MM-dd')}):`);
        console.log(`    Tariff: ${tariff.service_type}, client: ${tariff.client_id}, sp: ${tariff.punto_servizio_id}, forn: ${tariff.fornitore_id}, dates: ${tariff.data_inizio_validita} - ${tariff.data_fine_validita}`);
        console.log(`    Matches: client=${clientMatch}, type=${typeMatch}, active=${isTariffActive}, sp=${servicePointMatch}, forn=${fornitoreMatch}`);
    }
    return matchResult;
  });

  console.log("calculateServiceCost: matchingTariffs =", matchingTariffs);

  if (matchingTariffs.length === 0) {
    console.log("calculateServiceCost: No matching tariffs found for details:", details);
    return null;
  }
  // ... (rest of the function)
}