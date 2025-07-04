export interface Cliente {
  id: string;
  nome_cliente: string;
  codice_fiscale?: string;
  partita_iva?: string;
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
}

export interface PuntoServizio {
  id: string;
  nome_punto_servizio: string;
  id_cliente: string;
  indirizzo?: string | null;
  citta?: string | null;
  cap?: string | null;
  provincia?: string | null;
  referente?: string | null;
  telefono_referente?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  telefono?: string | null;
  email?: string | null;
  note?: string | null;
  tempo_intervento?: number | null;
  fornitore_id?: string | null;
  codice_cliente?: string | null;
  codice_sicep?: string | null;
  codice_fatturazione?: string | null;
  procedure_id?: string | null;
  clienti?: { nome_cliente: string } | null; // Aggiunto per join
  fornitori?: { nome_fornitore: string } | null; // Added for join
  procedure?: { nome_procedura: string } | null; // Added for join
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
  created_at?: string; // Made optional
  nome: string; // Renamed from nome_operatore
  cognome?: string; // New field
  client_id?: string; // New field
  telefono?: string;
  email?: string;
}

export interface OperatoreNetworkExtended extends OperatoreNetwork {
  clienti?: { nome_cliente: string }[] | null; // Added for join, assuming it's an array
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

export interface ServiziCanone {
  id: string;
  created_at?: string;
  service_point_id: string;
  fornitore_id?: string | null;
  tipo_canone: string;
  start_date: string;
  end_date?: string | null;
  status: "Attivo" | "Inattivo" | "Sospeso";
  notes?: string | null;
  calculated_cost?: number | null; // New field
  client_id?: string | null; // New field
  unita_misura?: string | null; // New field
}

export interface ServiziCanoneExtended extends ServiziCanone {
  punti_servizio?: { nome_punto_servizio: string } | null; // Added for join
  fornitori?: { nome_fornitore: string } | null; // Added for join
  clienti?: { nome_cliente: string } | null; // Added for join
}

export interface RapportoServizio {
  id: string;
  created_at: string;
  service_date: string;
  employee_id: string;
  service_location: string;
  service_type: string;
  start_time: string;
  end_time: string;
  vehicle_make_model: string;
  vehicle_plate: string;
  start_km: number;
  end_km: number;
  vehicle_initial_state: string;
  danni_veicolo?: string | null; // Renamed from bodywork_damage
  vehicle_anomalies?: string | null;
  gps: boolean;
  radio_vehicle: boolean;
  swiveling_lamp: boolean;
  radio_portable: boolean;
  flashlight: boolean;
  extinguisher: boolean;
  spare_tire: boolean;
  high_visibility_vest: boolean;
}

export interface RichiestaManutenzione {
  id: string;
  created_at: string;
  report_id?: string | null;
  service_point_id?: string | null;
  vehicle_plate: string;
  issue_description?: string | null;
  status: "Pending" | "In Progress" | "Completed" | "Cancelled";
  priority: "Low" | "Medium" | "High" | "Urgent";
  requested_by_employee_id?: string | null;
  requested_at: string;
  repair_activities?: string | null; // Nuovo campo
  // Joined fields for display
  service_point?: { nome_punto_servizio: string } | null;
  requested_by_employee?: { nome: string; cognome: string } | null;
}

export interface CantiereReport { // Defined CantiereReport interface
  id: string;
  report_date: string;
  report_time: string;
  client_id: string;
  site_name: string;
  employee_id: string;
  service_provided: string;
  automezziCount: number; // Assuming these are part of the report
  attrezziCount: number; // Assuming these are part of the report
  // Add other fields as per your DB schema for cantiere_reports
  clienti?: { nome_cliente: string } | null; // Added for join
  addetto?: { nome: string; cognome: string } | null; // Added for join
}

export interface ServiceRequest { // Re-defining or extending existing ServiceRequest
  id: string;
  type: string;
  client_id: string;
  service_point_id: string;
  fornitore_id?: string | null;
  start_date: string;
  start_time: string;
  end_date?: string | null;
  end_time?: string | null;
  status: "Pending" | "In Progress" | "Completed" | "Cancelled";
  notes?: string | null;
  calculated_cost?: number | null;
  multiplier?: number | null;
  // Add joined fields
  clienti?: { nome_cliente: string } | null; // Added for join
  punti_servizio?: { nome_punto_servizio: string } | null; // Added for join
  fornitori?: { nome_fornitore: string } | null; // Added for join
}


export interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'user';
}

export const serviceTypeRateOptions: string[] = [
  "Piantonamento",
  "Servizi Fiduciari",
  "Ispezioni",
  "Bonifiche",
  "Gestione Chiavi",
  "Apertura/Chiusura",
  "Intervento",
  "Disponibilità Pronto Intervento", // Added from tipoCanoneOptions
  "Videosorveglianza", // Added from tipoCanoneOptions
  "Impianto Allarme", // Added from tipoCanoneOptions
  "Bidirezionale", // Added from tipoCanoneOptions
  "Monodirezionale", // Added from tipoCanoneOptions
  "Tenuta Chiavi", // Added from tipoCanoneOptions
];