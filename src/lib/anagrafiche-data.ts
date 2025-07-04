// src/lib/anagrafiche-data.ts

export interface Cliente {
  id: string;
  nome_cliente: string;
  // Add other properties as needed based on your database schema
  partita_iva?: string;
  codice_fiscale?: string;
  indirizzo?: string;
  citta?: string;
  cap?: string;
  provincia?: string;
  telefono?: string;
  email?: string;
  pec?: string;
  sdi?: string;
  attivo?: boolean;
  note?: string;
  created_at?: string; // Assuming created_at is common
}

export interface Fornitore {
  id: string;
  nome_fornitore: string;
  tipo_servizio: "" | "piantonamento" | "fiduciario" | "entrambi"; // Strict type
  // Add other properties as needed
  created_at?: string;
}

export interface PuntoServizio {
  id: string;
  nome_punto_servizio: string;
  id_cliente: string;
  id_fornitore: string;
  procedure_id?: string; // Corrected from 'procedure'
  clienti?: Cliente; // Changed to single Cliente object for direct join
  fornitori?: Fornitore; // Changed to single Fornitore object for direct join
  // Add other properties as needed
  created_at?: string;
}

export interface Personale {
  id: string;
  nome: string;
  cognome: string;
  email: string;
  telefono: string;
  ruolo: string; // e.g., 'GPG', 'Pattuglia'
  client_id?: string; // Optional if not always present
  created_at: string; // Required for OperatoreNetwork
}

export interface OperatoreNetwork extends Personale {
  // OperatoreNetwork is essentially a Personale with client_id and created_at
  // If OperatoreNetwork is a distinct table, define its specific fields.
  // Assuming it's a view or a subset of Personale with client_id.
  // The error suggests it's missing created_at, so ensure it's there.
  clienti?: Cliente; // For joins in OperatoriNetworkTable
}