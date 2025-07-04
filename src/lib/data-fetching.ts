import { supabase } from "@/integrations/supabase/client";
import { Cliente, Fornitore, OperatoreNetwork, PuntoServizio, Procedure, ServiziCanone, ServiceRequest, CantiereReport } from "@/lib/anagrafiche-data";

export async function fetchClienti(): Promise<Cliente[]> {
  const { data, error } = await supabase.from('clienti').select('*');
  if (error) throw error;
  return data;
}

export async function fetchFornitori(): Promise<Fornitore[]> {
  const { data, error } = await supabase.from('fornitori').select('*');
  if (error) throw error;
  return data;
}

export async function fetchOperatoriNetwork(): Promise<OperatoreNetwork[]> {
  const { data, error } = await supabase.from('operatori_network').select('*, created_at'); // Ensure created_at is selected
  if (error) throw error;
  return data;
}

export async function fetchPuntiServizio(): Promise<PuntoServizio[]> {
  const { data, error } = await supabase.from('punti_servizio').select('*');
  if (error) throw error;
  return data;
}

export async function fetchProcedure(): Promise<Procedure[]> {
  const { data, error } = await supabase.from('procedure').select('*');
  if (error) throw error;
  return data;
}

export async function fetchServiziCanone(): Promise<ServiziCanone[]> {
  const { data, error } = await supabase.from('servizi_canone').select('*');
  if (error) throw error;
  return data;
}

export async function fetchServiceRequests(): Promise<ServiceRequest[]> {
  const { data, error } = await supabase.from('service_requests').select('*');
  if (error) throw error;
  return data;
}

export async function fetchCantiereReports(): Promise<CantiereReport[]> {
  const { data, error } = await supabase.from('cantiere_reports').select('*');
  if (error) throw error;
  return data;
}