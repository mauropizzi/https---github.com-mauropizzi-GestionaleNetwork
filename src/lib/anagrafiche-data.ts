export interface Cliente {
  id: string;
  created_at?: string;
  nome_cliente: string;
  codice_fiscale?: string | null;
  partita_iva?: string | null;
  indirizzo?: string | null;
  citta?: string | null;
  cap?: string | null;
  provincia?: string | null;
  telefono?: string | null;
  email?: string | null;
  pec?: string | null;
  sdi?: string | null;
  attivo?: boolean;
  note?: string | null;
}

export interface PuntoServizio {
  id: string;
  created_at?: string;
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
  clienti?: { nome_cliente: string } | null; // For direct join
  fornitori?: { nome_fornitore: string } | null; // For direct join
  procedure?: { nome_procedura: string } | null; // For direct join
}

export interface Fornitore {
  id: string;
  created_at?: string;
  nome_fornitore: string;
  partita_iva?: string | null;
  codice_fiscale?: string | null;
  referente?: string | null;
  telefono?: string | null;
  email?: string | null;
  tipo_fornitura?: string | null;
  indirizzo?: string | null;
  cap?: string | null;
  citta?: string | null;
  provincia?: string | null;
  pec?: string | null;
  attivo?: boolean;
  note?: string | null;
}

export interface Personale {
  id: string;
  created_at?: string;
  nome: string;
  cognome: string;
  codice_fiscale?: string | null;
  ruolo: string;
  telefono?: string | null;
  email?: string | null;
  data_nascita?: string | null; // Changed to string to match DB format (ISO date string)
  luogo_nascita?: string | null;
  indirizzo?: string | null;
  cap?: string | null;
  citta?: string | null;
  provincia?: string | null;
  data_assunzione?: string | null; // Changed to string to match DB format
  data_cessazione?: string | null; // Changed to string to match DB format
  attivo?: boolean;
  note?: string | null;
}

export interface OperatoreNetwork {
  id: string;
  created_at: string;
  nome: string;
  cognome?: string | null;
  client_id?: string | null;
  telefono?: string | null;
  email?: string | null;
}

export interface Procedure {
  id: string;
  created_at?: string;
  nome_procedura: string;
  descrizione?: string | null;
  versione?: string | null;
  data_ultima_revisione?: string | null; // ISO date string
  responsabile?: string | null;
  documento_url?: string | null;
  attivo?: boolean;
  note?: string | null;
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
  calculated_cost?: number | null;
  client_id?: string | null;
  unita_misura?: string | null;
}

export interface RapportoServizio {
  id: string;
  created_at?: string;
  service_date: string;
  employee_id: string;
  service_location: string; // This is the name, not ID
  service_location_id?: string | null; // Actual ID of the service point
  service_type: string;
  start_time: string;
  end_time: string;
  vehicle_make_model: string;
  vehicle_plate: string;
  start_km: number;
  end_km: number;
  vehicle_initial_state: string;
  danni_veicolo?: string | null;
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

export interface ServiziRichiesti { // Renamed from ServiceRequest
  id: string;
  created_at?: string;
  type: string;
  client_id?: string | null;
  service_point_id?: string | null;
  fornitore_id?: string | null;
  start_date: string;
  start_time?: string | null;
  end_date?: string | null;
  end_time?: string | null;
  status: "Pending" | "Approved" | "Rejected" | "Completed";
  calculated_cost?: number | null;
  num_agents?: number | null;
  cadence_hours?: number | null;
  inspection_type?: string | null;
  daily_hours_config?: any | null; // JSONB type
  // Joined fields (Supabase returns these as direct objects if single, or null)
  clienti?: { nome_cliente: string } | null;
  punti_servizio?: { nome_punto_servizio: string } | null;
  fornitori?: { nome_fornitore: string } | null;
}

export interface RegistroDiCantiere { // Renamed from CantiereReport
  id: string;
  created_at?: string;
  report_date: string;
  report_time: string;
  client_id?: string | null;
  site_name: string;
  employee_id?: string | null;
  service_provided: string;
  notes?: string | null;
  start_datetime?: string | null;
  end_datetime?: string | null;
  status: "attivo" | "terminato";
  addetto_riconsegna_security_service?: string | null;
  responsabile_committente_riconsegna?: string | null;
  esito_servizio?: string | null;
  consegne_servizio?: string | null;
  service_point_id?: string | null; // Added to match DB schema
  latitude?: number | null; // Added to match DB schema
  longitude?: number | null; // Added to match DB schema
}

export interface RichiestaManutenzione {
  id: string;
  created_at?: string;
  report_id?: string | null;
  service_point_id?: string | null;
  vehicle_plate: string;
  issue_description?: string | null;
  status: "Pending" | "In Progress" | "Completed" | "Cancelled";
  priority: "Low" | "Medium" | "High" | "Urgent";
  requested_by_employee_id?: string | null;
  requested_at: string;
  repair_activities?: string | null;
  // Joined fields for display
  service_point?: { nome_punto_servizio: string } | null;
  requested_by_employee?: { nome: string; cognome: string } | null;
}

export interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'user';
  created_at?: string;
}

export const serviceTypeRateOptions: string[] = [
  "Piantonamento",
  "Servizi Fiduciari",
  "Ispezioni",
  "Bonifiche",
  "Gestione Chiavi",
  "Apertura/Chiusura",
  "Intervento",
  "Disponibilità Pronto Intervento",
  "Videosorveglianza",
  "Impianto Allarme",
  "Bidirezionale",
  "Monodirezionale",
  "Tenuta Chiavi",
];