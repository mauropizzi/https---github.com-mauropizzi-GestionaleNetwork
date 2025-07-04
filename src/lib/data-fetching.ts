import { supabase } from "@/integrations/supabase/client";
import { Cliente, Fornitore, OperatoreNetwork, PuntoServizio, Procedure, ServiziCanone, ServiziRichiesti, RegistroDiCantiere, Personale } from "@/lib/anagrafiche-data";
import { format, differenceInDays, differenceInMonths, getDaysInMonth, isWeekend, isSameDay, parseISO, isValid } from 'date-fns';
import { it } from 'date-fns/locale';
import { isDateHoliday } from "@/lib/date-utils";
import { showError } from "@/utils/toast";
import { getUnitaMisuraForServizio } from "@/lib/tariff-utils"; // Import the utility

// Cache for fetched data to reduce redundant API calls
const dataCache: { [key: string]: any } = {};

// Function to invalidate a specific cache key
export function invalidateCache(key: string) {
  delete dataCache[key];
}

// Generic fetch function with caching
async function fetchAndCache<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  if (dataCache[key]) {
    return dataCache[key];
  }
  const data = await fetcher();
  dataCache[key] = data;
  return data;
}

export async function fetchClienti(): Promise<Cliente[]> {
  return fetchAndCache('clienti', async () => {
    const { data, error } = await supabase.from('clienti').select('*');
    if (error) throw error;
    return data;
  });
}

export async function fetchFornitori(): Promise<Fornitore[]> {
  return fetchAndCache('fornitori', async () => {
    const { data, error } = await supabase.from('fornitori').select('*');
    if (error) throw error;
    return data;
  });
}

export async function fetchOperatoriNetwork(): Promise<OperatoreNetwork[]> {
  return fetchAndCache('operatori_network', async () => {
    const { data, error } = await supabase.from('operatori_network').select('*, created_at');
    if (error) throw error;
    return data;
  });
}

export async function fetchPuntiServizio(): Promise<PuntoServizio[]> {
  return fetchAndCache('punti_servizio', async () => {
    const { data, error } = await supabase.from('punti_servizio').select('*, clienti(nome_cliente), fornitori(nome_fornitore), procedure(nome_procedura)');
    if (error) throw error;
    return data;
  });
}

export async function fetchProcedure(): Promise<Procedure[]> {
  return fetchAndCache('procedure', async () => {
    const { data, error } = await supabase.from('procedure').select('*');
    if (error) throw error;
    return data;
  });
}

export async function fetchServiziCanone(): Promise<ServiziCanone[]> {
  return fetchAndCache('servizi_canone', async () => {
    const { data, error } = await supabase.from('servizi_canone').select('*');
    if (error) throw error;
    return data;
  });
}

export async function fetchServiziRichiesti(): Promise<ServiziRichiesti[]> {
  return fetchAndCache('servizi_richiesti', async () => {
    const { data, error } = await supabase.from('servizi_richiesti').select('*');
    if (error) throw error;
    return data;
  });
}

export async function fetchRegistroDiCantiere(): Promise<RegistroDiCantiere[]> {
  return fetchAndCache('registro_di_cantiere', async () => {
    const { data, error } = await supabase.from('registri_cantiere').select('*');
    if (error) throw error;
    return data;
  });
}

export async function fetchPersonale(role?: string): Promise<Personale[]> {
  return fetchAndCache(role ? `personale_${role}` : 'personale_all', async () => {
    let query = supabase.from('personale').select('*');
    if (role) {
      query = query.eq('ruolo', role);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data;
  });
}

export async function fetchAllTariffe(): Promise<any[]> {
  return fetchAndCache('tariffe_all', async () => {
    const { data, error } = await supabase
      .from('tariffe')
      .select('*, clienti(nome_cliente), punti_servizio(nome_punto_servizio), fornitori(nome_fornitore)');
    if (error) throw error;
    return data;
  });
}

export function invalidateTariffeCache() {
  invalidateCache('tariffe_all');
}

interface ServiceCostDetails {
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
  daily_hours_config?: Array<{ day: string; startTime: string; endTime: string; is24h: boolean }> | null;
  inspection_type?: string | null;
}

export async function calculateServiceCost(details: ServiceCostDetails): Promise<{ clientRate: number; supplierRate: number; multiplier: number; unitOfMeasure: string } | null> {
  const { type, client_id, service_point_id, fornitore_id, start_date, end_date, start_time, end_time, num_agents, cadence_hours, daily_hours_config, inspection_type } = details;

  // Fetch all tariffs
  const allTariffs = await fetchAllTariffe();

  // Find the most specific tariff
  const matchingTariffs = allTariffs.filter(tariff => {
    const tariffStartDate = tariff.data_inizio_validita ? parseISO(tariff.data_inizio_validita) : null;
    const tariffEndDate = tariff.data_fine_validita ? parseISO(tariff.data_fine_validita) : null;

    const isDateValid = (!tariffStartDate || start_date >= tariffStartDate) &&
                        (!tariffEndDate || end_date <= tariffEndDate);

    return tariff.service_type === type &&
           tariff.client_id === client_id &&
           isDateValid &&
           (tariff.punto_servizio_id === service_point_id || !tariff.punto_servizio_id) &&
           (tariff.fornitore_id === fornitore_id || !tariff.fornitore_id);
  });

  // Sort by specificity (more specific matches first)
  matchingTariffs.sort((a, b) => {
    let scoreA = 0;
    let scoreB = 0;
    if (a.punto_servizio_id) scoreA += 2;
    if (a.fornitore_id) scoreA += 1;
    if (a.data_inizio_validita || a.data_fine_validita) scoreA += 0.5;

    if (b.punto_servizio_id) scoreB += 2;
    if (b.fornitore_id) scoreB += 1;
    if (b.data_inizio_validita || b.data_fine_validita) scoreB += 0.5;

    return scoreB - scoreA;
  });

  const tariff = matchingTariffs[0];

  if (!tariff) {
    showError(`Nessuna tariffa trovata per il servizio '${type}' per il cliente selezionato nel periodo specificato.`);
    return null;
  }

  let multiplier = 0;
  const startDateObj = start_date;
  const endDateObj = end_date;
  const unitOfMeasure = tariff.unita_misura; // Get unit of measure from the matched tariff

  if (!isValid(startDateObj) || !isValid(endDateObj)) {
    showError("Date di inizio/fine servizio non valide per il calcolo del costo.");
    return null;
  }

  switch (unitOfMeasure) { // Use unitOfMeasure from tariff
    case "ora":
      if (!daily_hours_config || daily_hours_config.length === 0) {
        showError("Configurazione orari giornalieri mancante per il calcolo orario.");
        return null;
      }

      let totalHours = 0;
      let currentDate = new Date(startDateObj);
      while (currentDate <= endDateObj) {
        const dayOfWeek = format(currentDate, 'EEEE', { locale: it }); // 'Lunedì', 'Martedì', etc.
        const isHoliday = isDateHoliday(currentDate);
        const isWeekendDay = isWeekend(currentDate);

        let dayConfig;
        if (isHoliday) {
          dayConfig = daily_hours_config.find(d => d.day === "Festivi");
        } else if (isWeekendDay) {
          dayConfig = daily_hours_config.find(d => d.day === dayOfWeek);
          if (!dayConfig) dayConfig = daily_hours_config.find(d => d.day === "Domenica"); // Fallback for Sunday if specific config not found
        } else {
          dayConfig = daily_hours_config.find(d => d.day === dayOfWeek);
        }

        if (dayConfig) {
          let hoursForDay = 0;
          if (dayConfig.is24h) {
            hoursForDay = 24;
          } else if (dayConfig.startTime && dayConfig.endTime) {
            const start = new Date(`2000-01-01T${dayConfig.startTime}`);
            const end = new Date(`2000-01-01T${dayConfig.endTime}`);
            let hoursDiff = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
            if (hoursDiff < 0) hoursDiff += 24; // Handle overnight shifts
            hoursForDay = hoursDiff;
          }
        }
        currentDate = new Date(currentDate.setDate(currentDate.getDate() + 1));
      }
      multiplier = totalHours * (num_agents || 1);
      break;

    case "intervento":
      if (type === "Ispezioni") {
        if (!daily_hours_config || daily_hours_config.length === 0) {
          showError("Configurazione orari giornalieri mancante per il calcolo delle ispezioni.");
          return null;
        }
        if (!cadence_hours || cadence_hours <= 0) {
          showError("Cadenza oraria non valida per il calcolo delle ispezioni.");
          return null;
        }

        let totalInspections = 0;
        let currentDate = new Date(startDateObj);
        while (currentDate <= endDateObj) {
          const dayOfWeek = format(currentDate, 'EEEE', { locale: it }); // 'Lunedì', 'Martedì', etc.
          const isHoliday = isDateHoliday(currentDate);
          const isWeekendDay = isWeekend(currentDate);

          let dayConfig;
          if (isHoliday) {
            dayConfig = daily_hours_config.find(d => d.day === "Festivi");
          } else if (isWeekendDay) {
            dayConfig = daily_hours_config.find(d => d.day === dayOfWeek);
            if (!dayConfig) dayConfig = daily_hours_config.find(d => d.day === "Domenica"); // Fallback for Sunday if specific config not found
          } else {
            dayConfig = daily_hours_config.find(d => d.day === dayOfWeek);
          }

          if (dayConfig) {
            let hoursForDay = 0;
            if (dayConfig.is24h) {
              hoursForDay = 24;
            } else if (dayConfig.startTime && dayConfig.endTime) {
              const start = new Date(`2000-01-01T${dayConfig.startTime}`);
              const end = new Date(`2000-01-01T${dayConfig.endTime}`);
              let hoursDiff = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
              if (hoursDiff < 0) hoursDiff += 24; // Handle overnight shifts
              hoursForDay = hoursDiff;
            }
            totalInspections += (hoursForDay / cadence_hours);
          }
          currentDate = new Date(currentDate.setDate(currentDate.getDate() + 1));
        }
        multiplier = totalInspections;
      } else {
        // For other service types that are 'intervento' but not 'Ispezioni' (e.g., Bonifiche, Gestione Chiavi, Apertura/Chiusura)
        // These are typically single interventions, so multiplier remains 1.
        multiplier = 1;
      }
      break;

    case "km":
      // Logic for KM based services, if applicable. Needs start_km and end_km in details.
      // For now, assuming 1 unit if not specified.
      multiplier = 1;
      break;

    case "mese":
      const monthsDiff = differenceInMonths(endDateObj, startDateObj);
      const daysDiff = differenceInDays(endDateObj, startDateObj);
      const startDay = startDateObj.getDate();
      const endDay = endDateObj.getDate();

      if (monthsDiff === 0 && daysDiff < getDaysInMonth(startDateObj)) {
        // Less than a month, prorate based on days
        multiplier = daysDiff / getDaysInMonth(startDateObj);
      } else {
        // Full months + prorated last month if applicable
        multiplier = monthsDiff;
        if (endDay < startDay) {
          // If end day is before start day in the last month, it means a full month hasn't passed yet for that partial month
          // Example: Jan 15 - Mar 10. Diff is 1 month. But it's 1 full month (Feb) + partial Jan + partial Mar.
          // For simplicity, if end day is before start day, count it as one less full month and add partial days.
          // Or, if it's Jan 15 - Feb 14, it's 1 month. If Jan 15 - Feb 15, it's 1 month.
          // If Jan 15 - Feb 16, it's 1 month + 1 day.
          // A simpler approach for monthly billing is often just full months.
          // Let's assume full months for now, and if there's a partial month, it's rounded up or down based on business logic.
          // For now, if end_date is after start_date, count as at least 1 month.
          multiplier = Math.max(1, monthsDiff);
        } else {
          multiplier = monthsDiff + (daysDiff % getDaysInMonth(startDateObj) > 0 ? 1 : 0); // Add 1 if there's any partial month
        }
      }
      // Ensure at least 1 if there's any duration
      if (multiplier === 0 && daysDiff >= 0) {
        multiplier = 1;
      }
      break;

    default:
      multiplier = 1; // Default to 1 unit if unit of measure is unknown
      break;
  }

  return {
    clientRate: tariff.client_rate,
    supplierRate: tariff.supplier_rate,
    multiplier: multiplier,
    unitOfMeasure: unitOfMeasure, // Return the unit of measure
  };
}

export async function fetchServiceRequestsForAnalysis(
  clientId?: string,
  startDate?: string,
  endDate?: string
): Promise<ServiziRichiesti[]> {
  let query = supabase.from('servizi_richiesti').select('*');

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
  if (error) throw error;
  return data;
}

export async function fetchServiziCanoneForAnalysis(
  clientId?: string,
  startDate?: string,
  endDate?: string
): Promise<ServiziCanone[]> {
  let query = supabase.from('servizi_canone').select('*');

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
  if (error) throw error;
  return data;
}