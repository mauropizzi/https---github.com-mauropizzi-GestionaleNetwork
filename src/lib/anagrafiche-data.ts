export interface Cliente {
  id: string;
  nome_cliente: string;
}

export interface PuntoServizio {
  id: string;
  nome_punto_servizio: string;
  id_cliente: string; // Assuming a link back to Cliente
  tempo_intervento?: number; // Added tempo_intervento
  codice_sicep?: string; // Added for mapping in InterventionForm
  codice_cliente?: string; // Added for mapping in InterventionForm
  procedure_id?: string | null; // Nuovo campo per l'associazione con la procedura
}

export interface Fornitore {
  id: string;
  nome_fornitore: string;
  partita_iva?: string;
  codice_fiscale?: string;
  referente?: string;
  telefono?: string;
  email?: string;
  tipo_fornitura?: string;
  indirizzo?: string;
  cap?: string;
  citta?: string;
  provincia?: string;
  pec?: string;
  attivo?: boolean;
  note?: string;
}

export interface Personale {
  id: string;
  created_at?: string;
  nome: string;
  cognome: string;
  codice_fiscale?: string;
  ruolo: string;
  telefono?: string;
  email?: string;
  data_nascita?: string; // Changed to string to match DB format (ISO date string)
  luogo_nascita?: string;
  indirizzo?: string;
  cap?: string;
  citta?: string;
  provincia?: string;
  data_assunzione?: string; // Changed to string to match DB format
  data_cessazione?: string; // Changed to string to match DB format
  attivo?: boolean;
  note?: string;
}

export interface OperatoreNetwork {
  id: string;
  created_at: string;
  nome: string; // Renamed from nome_operatore
  cognome?: string; // New field
  client_id?: string; // New field
  telefono?: string;
  email?: string;
}

export interface Procedure {
  id: string;
  created_at?: string;
  nome_procedura: string;
  descrizione?: string;
  versione?: string;
  data_ultima_revisione?: string; // ISO date string
  responsabile?: string;
  documento_url?: string;
  attivo?: boolean;
  note?: string;
}

export const serviceTypeRateOptions: string[] = [
  "Piantonamento",
  "Servizi Fiduciari",
  "Ispezioni",
  "Bonifiche",
  "Gestione Chiavi",
  "Apertura/Chiusura",
  "Intervento", // Added 'Intervento'
];