import { supabase } from "@/integrations/supabase/client";
import { Cliente, Fornitore, PuntoServizio, Personale, OperatoreNetwork } from "@/lib/anagrafiche-data";
import { Canone } from "@/lib/canone-data";
import { CantiereReport } from "@/lib/cantiere-data";
import { ServiceRequest } from "@/lib/service-request-data"; // Import ServiceRequest

// Define the structure for fetched data that might include joined tables
// This helps in type safety when selecting related data
interface PuntoServizioWithRelations extends PuntoServizio {
  clienti?: { nome_cliente: string } | null; // Changed to single object or null
  fornitori?: { nome: string } | null; // Changed to single object or null
  procedure_speciali?: { nome_procedura: string } | null; // Changed to single object or null
}

interface CanoneWithRelations extends Canone {
  clienti?: { nome_cliente: string } | null; // Changed to single object or null
  punti_servizio?: { nome_punto_servizio: string } | null; // Changed to single object or null
  fornitori?: { nome: string } | null; // Changed to single object or null
}

interface CantiereReportWithRelations extends CantiereReport {
  clienti?: { nome_cliente: string } | null; // Changed to single object or null
  punti_servizio?: { nome_punto_servizio: string } | null; // Changed to single object or null
  personale?: { nome: string; cognome: string } | null; // Changed to single object or null
}

interface OperatoreNetworkWithRelations extends OperatoreNetwork {
  clienti?: { nome_cliente: string } | null; // Changed to single object or null
}

// --- Fetching functions ---

export async function fetchClienti(): Promise<Cliente[]> {
  const { data, error } = await supabase.from("clienti").select("*");
  if (error) {
    console.error("Error fetching clienti:", error);
    return [];
  }
  return data as Cliente[];
}

export async function fetchFornitori(): Promise<Fornitore[]> {
  const { data, error } = await supabase.from("fornitori").select("*");
  if (error) {
    console.error("Error fetching fornitori:", error);
    return [];
  }
  return data as Fornitore[];
}

export async function fetchPuntiServizio(): Promise<PuntoServizioWithRelations[]> {
  const { data, error } = await supabase
    .from("punti_servizio")
    .select(`*, clienti(nome_cliente), fornitori(nome), procedure_speciali(nome_procedura)`);
  if (error) {
    console.error("Error fetching punti_servizio:", error);
    return [];
  }
  // Ensure nested relations are always single objects or null for consistency
  return data.map(ps => ({
    ...ps,
    clienti: ps.clienti || null,
    fornitori: ps.fornitori || null,
    procedure_speciali: ps.procedure_speciali || null,
  })) as PuntoServizioWithRelations[];
}

export async function fetchPersonale(ruolo?: string): Promise<Personale[]> {
  let query = supabase.from("personale").select("*");
  if (ruolo) {
    query = query.eq("ruolo", ruolo);
  }
  const { data, error } = await query;
  if (error) {
    console.error("Error fetching personale:", error);
    return [];
  }
  return data as Personale[];
}

export async function fetchOperatoriNetwork(): Promise<OperatoreNetworkWithRelations[]> {
  const { data, error } = await supabase
    .from("operatori_network")
    .select(`*, clienti(nome_cliente)`); // Select related client data
  if (error) {
    console.error("Error fetching operatori_network:", error);
    return [];
  }
  // Ensure 'clienti' is always a single object or null
  return data.map(op => ({
    ...op,
    clienti: op.clienti || null,
  })) as OperatoreNetworkWithRelations[];
}

export async function fetchCanoni(): Promise<CanoneWithRelations[]> {
  const { data, error } = await supabase
    .from("canoni")
    .select(`*, clienti(nome_cliente), punti_servizio(nome_punto_servizio), fornitori(nome)`);
  if (error) {
    console.error("Error fetching canoni:", error);
    return [];
  }
  // Ensure nested relations are always single objects or null
  return data.map(canone => ({
    ...canone,
    clienti: canone.clienti || null,
    punti_servizio: canone.punti_servizio || null,
    fornitori: canone.fornitori || null,
  })) as CanoneWithRelations[];
}

export async function fetchCantiereReports(): Promise<CantiereReportWithRelations[]> {
  const { data, error } = await supabase
    .from("registri_cantiere")
    .select(`
      *,
      clienti:client_id(nome_cliente),
      punti_servizio:service_point_id(nome_punto_servizio),
      personale:employee_id(nome, cognome)
    `);
  if (error) {
    console.error("Error fetching cantiere reports:", error);
    return [];
  }
  // Ensure nested relations are always single objects or null
  return data.map(report => ({
    ...report,
    clienti: report.clienti || null,
    punti_servizio: report.punti_servizio || null,
    personale: report.personale || null,
  })) as CantiereReportWithRelations[];
}