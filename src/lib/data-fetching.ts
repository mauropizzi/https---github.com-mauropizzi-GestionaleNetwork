import { supabase } from "@/integrations/supabase/client";
import { Cliente, Fornitore, PuntoServizio, Personale, OperatoreNetwork, Procedure } from "@/lib/anagrafiche-data";
import { showError } from "@/utils/toast";

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
    .select('id, type, client_id, service_point_id, start_date, calculated_cost'); // Added start_date

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
    .select('id, client_id, service_type, punto_servizio_id, fornitore_id, data_inizio_validita, data_fine_validita');

  if (error) {
    showError(`Errore nel recupero di tutte le tariffe: ${error.message}`);
    console.error("Error fetching all tariffe:", error);
    return [];
  }
  return data || [];
}