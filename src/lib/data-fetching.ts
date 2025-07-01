import { supabase } from "@/integrations/supabase/client";
import { Cliente, Fornitore, PuntoServizio, Personale, OperatoreNetwork, Procedure } from "@/lib/anagrafiche-data";
import { showError } from "@/utils/toast"; // Correzione qui
import { format, parseISO, isValid, addDays, isWeekend, differenceInHours, differenceInMinutes } from "date-fns";
import { it } from 'date-fns/locale';
import { isDateHoliday } from "@/lib/date-utils";

let cachedTariffe: any[] | null = null;
let lastTariffeFetchTime: number = 0;
const TARIFEE_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

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

export async function fetchAllTariffe(): Promise<any[]> {
  const now = Date.now();
  if (cachedTariffe && (now - lastTariffeFetchTime < TARIFEE_CACHE_DURATION)) {
    console.log("Using cached tariffs.");
    return cachedTariffe;
  }

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

export async function calculateServiceCost(details: ServiceDetailsForCost): Promise<{ multiplier: number; clientRate: number; supplierRate: number } | null> {
  const allTariffe = await fetchAllTariffe();
  console.log("--- calculateServiceCost Debug Start ---");
  console.log("Service Details (input):", {
    type: details.type,
    client_id: details.client_id,
    service_point_id: details.service_point_id,
    fornitore_id: details.fornitore_id,
    startDate: format(details.start_date, 'yyyy-MM-dd'),
    endDate: format(details.end_date, 'yyyy-MM-dd'),
    cadence_hours: details.cadence_hours,
    daily_hours_config_present: !!details.daily_hours_config,
    daily_hours_config_value: details.daily_hours_config, // Log the actual value
  });

  const serviceStartDate = details.start_date;

  const matchingTariffs = allTariffe.filter(tariff => {
    const tariffStartDate = parseISO(tariff.data_inizio_validita);
    const tariffEndDate = tariff.data_fine_validita ? parseISO(tariff.data_fine_validita) : new Date(9999, 11, 31);

    const isTariffActive = serviceStartDate >= tariffStartDate && serviceStartDate <= tariffEndDate;

    const clientMatch = tariff.client_id === details.client_id;
    const typeMatch = tariff.service_type === details.type;
    // Prioritize specific service point match, then null (general)
    const servicePointMatch = (tariff.punto_servizio_id === details.service_point_id || tariff.punto_servizio_id === null);
    // Prioritize specific fornitore match, then null (general)
    const fornitoreMatch = (tariff.fornitore_id === details.fornitore_id || tariff.fornitore_id === null);

    const match = clientMatch && typeMatch && isTariffActive && servicePointMatch && fornitoreMatch;

    console.log(`  Tariff ID: ${tariff.id || 'N/A'}`);
    console.log(`    Tariff Data: { type: "${tariff.service_type}", client_id: "${tariff.client_id}", sp_id: "${tariff.punto_servizio_id}", forn_id: "${tariff.fornitore_id}", start_date: "${tariff.data_inizio_validita}", end_date: "${tariff.data_fine_validita}" }`);
    console.log(`    Match Criteria: Active: ${isTariffActive} (ServiceDate: ${format(serviceStartDate, 'yyyy-MM-dd')} vs TariffDates: ${format(tariffStartDate, 'yyyy-MM-dd')} - ${format(tariffEndDate, 'yyyy-MM-dd')})`);
    console.log(`                    Client: ${clientMatch}, Type: ${typeMatch}, ServicePoint: ${servicePointMatch}, Fornitore: ${fornitoreMatch}`);
    console.log(`    Overall Tariff Match for ID ${tariff.id}: ${match}`);

    return match;
  });

  console.log("Matching Tariffs (after filter):", matchingTariffs);

  if (matchingTariffs.length === 0) {
    console.warn("No matching tariffs found for service details:", details);
    console.log("--- calculateServiceCost Debug End (No Match) ---");
    return null;
  }

  // Prioritize tariffs: specific service point > specific supplier > general client
  // Then, if multiple, pick the one with the latest start date (most recent)
  const sortedTariffs = matchingTariffs.sort((a, b) => {
    // Prioritize by service point specificity (non-null comes first)
    if (a.punto_servizio_id && !b.punto_servizio_id) return -1;
    if (!a.punto_servizio_id && b.punto_servizio_id) return 1;

    // Then by supplier specificity (non-null comes first)
    if (a.fornitore_id && !b.fornitore_id) return -1;
    if (!a.fornitore_id && b.fornitore_id) return 1;

    // Then by latest start date
    const dateA = parseISO(a.data_inizio_validita);
    const dateB = parseISO(b.data_inizio_validita);
    return dateB.getTime() - dateA.getTime();
  });

  const selectedTariff = sortedTariffs[0];
  console.log("Selected Tariff (after sorting):", selectedTariff);
  console.log("Selected Tariff unita_misura:", selectedTariff.unita_misura);


  let multiplier: number | null = null;

  switch (details.type) {
    case "Piantonamento":
    case "Servizi Fiduciari": {
      if (selectedTariff.unita_misura === "ora") {
        let totalHours = 0;
        let currentDate = new Date(details.start_date);
        const endDate = details.end_date;

        console.log(`Calculating hours for ${details.type} from ${format(currentDate, 'yyyy-MM-dd')} to ${format(endDate, 'yyyy-MM-dd')}`);
        console.log("Daily hours config:", details.daily_hours_config);

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
            // Map Italian day names to English for consistency with stored config if needed, or ensure stored config uses Italian
            const italianDayName = dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1);
            dayConfig = details.daily_hours_config?.find((d: any) => d.day === italianDayName);
          }
          
          console.log(`  Day: ${format(currentDate, 'yyyy-MM-dd')} (${dayOfWeek}), Holiday: ${isCurrentDayHoliday}, Found config:`, dayConfig);

          if (dayConfig) {
            if (dayConfig.is24h) {
              totalHours += 24;
              console.log(`    Added 24h. Current totalHours: ${totalHours}`);
            } else if (dayConfig.startTime && dayConfig.endTime) {
              const startOfDay = parseISO(format(currentDate, 'yyyy-MM-dd') + 'T' + dayConfig.startTime + ':00');
              const endOfDay = parseISO(format(currentDate, 'yyyy-MM-dd') + 'T' + dayConfig.endTime + ':00');
              
              if (isValid(startOfDay) && isValid(endOfDay)) {
                let dailyDiffMs = endOfDay.getTime() - startOfDay.getTime();
                if (dailyDiffMs < 0) { // Handle overnight shifts
                  dailyDiffMs += 24 * 60 * 60 * 1000;
                }
                const dailyHours = dailyDiffMs / (1000 * 60 * 60);
                totalHours += dailyHours;
                console.log(`    Added ${dailyHours.toFixed(2)}h. Current totalHours: ${totalHours}`);
              } else {
                console.warn(`    Invalid start/end times for ${dayConfig.day}: ${dayConfig.startTime} - ${dayConfig.endTime}`);
              }
            }
          } else {
            console.log(`    No specific config found for ${dayOfWeek}.`);
          }
          currentDate = addDays(currentDate, 1);
        }
        multiplier = totalHours * (details.num_agents || 1);
        console.log(`Final totalHours: ${totalHours}, num_agents: ${details.num_agents || 1}, Multiplier: ${multiplier}`);
      } else {
        console.log(`Tariff unit of measure is not 'ora' (${selectedTariff.unita_misura}), setting multiplier to null.`);
        multiplier = null;
      }
      break;
    }
    case "Ispezioni": {
      if (selectedTariff.unita_misura === "intervento") {
        let totalOperationalHours = 0;
        let currentDate = new Date(details.start_date);
        const endDate = details.end_date;

        console.log("Ispezioni: details.daily_hours_config", details.daily_hours_config);
        console.log("Ispezioni: start_date", details.start_date, "end_date", details.end_date);

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
          
          console.log(`  Day: ${format(currentDate, 'yyyy-MM-dd')} (${dayOfWeek}), Holiday: ${isCurrentDayHoliday}, Found config:`, dayConfig);

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
        console.log("Ispezioni: totalOperationalHours", totalOperationalHours);
        console.log("Ispezioni: details.cadence_hours", details.cadence_hours);

        if (details.cadence_hours && details.cadence_hours > 0) {
          multiplier = Math.floor(totalOperationalHours / details.cadence_hours) + 1;
        } else {
          multiplier = null;
        }
      } else {
        multiplier = null;
      }
      break;
    }
    case "Bonifiche":
    case "Gestione Chiavi":
    case "Apertura/Chiusura":
    case "Intervento": {
      if (selectedTariff.unita_misura === "intervento") {
        multiplier = 1; // Fixed cost per intervention, so multiplier is 1
      } else {
        multiplier = null;
      }
      break;
    }
    default:
      multiplier = null;
  }

  if (multiplier === null) {
    console.warn("Multiplier is null, cannot calculate cost.");
    console.log("--- calculateServiceCost Debug End (Multiplier Null) ---");
    return null;
  }

  console.log("Calculated Multiplier:", multiplier);
  console.log("Client Rate:", selectedTariff.client_rate);
  console.log("Supplier Rate:", selectedTariff.supplier_rate);
  console.log("--- calculateServiceCost Debug End (Success) ---");

  return {
    multiplier: multiplier,
    clientRate: selectedTariff.client_rate,
    supplierRate: selectedTariff.supplier_rate,
  };
}