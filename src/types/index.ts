// src/types/index.ts (or where these types are defined)

import { Cliente, Fornitore, PuntoServizio, Personale } from '@/lib/anagrafiche-data';

export interface ServiceRequest {
  id: string;
  type: string;
  client_id: string;
  service_point_id: string;
  fornitore_id: string;
  start_date: string;
  start_time: string;
  end_date: string;
  end_time: string;
  status: string;
  calculated_cost: number;
  multiplier: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  clienti: Cliente; // Ensure this is Cliente, not Cliente[]
  fornitori: Fornitore;
  punti_servizio: PuntoServizio; // Ensure this is PuntoServizio, not PuntoServizio[]
  // Add other properties as needed
}

export interface Canone {
  id: string;
  // ... other Canone properties
  punti_servizio: { nome_punto_servizio: string; };
  fornitori: { nome_fornitore: string; };
  clienti: { nome_cliente: string; };
  // Add other properties as needed
}

export interface CantiereReport {
  id: string;
  report_date: string;
  report_time: string;
  client_id: string;
  site_name: string;
  employee_id: string;
  service_provided: string;
  start_datetime: string;
  end_datetime: string;
  notes?: string;
  service_point_id: string;
  addetto_riconsegna_security_service?: string;
  responsabile_committente_riconsegna?: string;
  esito_servizio?: string;
  consegne_servizio?: string;
  status: "attivo" | "terminato";
  latitude?: number;
  longitude?: number;
  created_at: string;
  updated_at: string;
  clienti: { nome_cliente: string; }; // For CantiereHistoryTable
  personale: { nome: string; cognome: string; }; // For CantiereHistoryTable
  automezzi_utilizzati?: Array<{ tipologia: string; marca: string; targa: string; }>;
  attrezzi_utilizzati?: Array<{ tipologia: string; marca: string; quantita: number; }>;
  // Add other properties as needed
}

// For import utility results (Errors 30, 31, 33, 34)
export interface ImportResult {
  newRecordsCount: number;
  updatedRecordsCount: number;
  invalidRecords: any[];
  duplicateRecords: any[]; // Add this property
  errors?: string[];
}