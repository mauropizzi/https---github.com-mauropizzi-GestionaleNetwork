import { supabase } from "@/integrations/supabase/client";
import { Cliente, Fornitore, PuntoServizio, Personale, OperatoreNetwork, Procedure } from "@/lib/anagrafiche-data";
import { showError } from "@/utils/toast";
import { format, parseISO, isValid, addDays, isWeekend, differenceInHours, differenceInMinutes } from "date-fns";
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
  const serviceStartDate = details.start_date;

  const matchingTariffs = allTariffe.filter(tariff => {
    const tariffStartDate = (typeof tariff.data_inizio_validita === 'string' && tariff.data_inizio_validita)
      ? parseISO(tariff.data_inizio_validita)
      : new Date(0);
    const tariffEndDate = (typeof tariff.data_fine_validita === 'string' && tariff.data_fine_validita)
      ? parseISO(tariff.data_fine_validita)
      : new Date(9999, 11, 31);

    const isTariffActive = serviceStartDate >= tariffStartDate && serviceStartDate <= tariffEndDate;
    const clientMatch = tariff.client_id === details.client_id;
    const typeMatch = tariff.service_type === details.type;
    const servicePointMatch = (tariff.punto_servizio_id === details.service_point_id || tariff.punto_servizio_id === null);
    const fornitoreMatch = (tariff.fornitore_id === details.fornitore_id || tariff.fornitore_id === null);

    return clientMatch && typeMatch && isTariffActive && servicePointMatch && fornitoreMatch;
  });

  if (matchingTariffs.length === 0) {
    return null;
  }

  const sortedTariffs = matchingTariffs.sort((a, b) => {
    if (a.punto_servizio_id && !b.punto_servizio_id) return -1;
    if (!a.punto_servizio_id && b.punto_servizio_id) return 1;
    if (a.fornitore_id && !b.fornitore_id) return -1;
    if (!a.fornitore_id && b.fornitore_id) return 1;
    
    const dateA = (typeof a.data_inizio_validita === 'string' && a.data_inizio_validita)
      ? parseISO(a.data_inizio_validita)
      : new Date(0);
    const dateB = (typeof b.data_inizio_validita === 'string' && b.data_inizio_validita)
      ? parseISO(b.data_inizio_validita)
      : new Date(0);
    return dateB.getTime() - dateA.getTime();
  });

  const selectedTariff = sortedTariffs[0];
  const multiplier = await calculateServiceMultiplier(details);

  if (multiplier === null) {
    return null;
  }

  return {
    multiplier: multiplier,
    clientRate: selectedTariff.client_rate,
    supplierRate: selectedTariff.supplier_rate,
  };
}