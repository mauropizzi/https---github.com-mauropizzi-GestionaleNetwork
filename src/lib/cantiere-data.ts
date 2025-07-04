// src/lib/cantiere-data.ts

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
  notes?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  service_point_id?: string | null;
  addetto_riconsegna_security_service?: string | null;
  responsabile_committente_riconsegna?: string | null;
  esito_servizio?: string | null;
  consegne_servizio?: string | null;
  status: "attivo" | "terminato";
  created_at?: string;
  updated_at?: string;
  // Relations (fetched via join)
  clienti?: { nome_cliente: string } | null;
  punti_servizio?: { nome_punto_servizio: string } | null;
  personale?: { nome: string; cognome: string } | null;
  automezzi_utilizzati?: Array<{ tipologia: string; marca: string; targa: string }> | null;
  attrezzi_utilizzati?: Array<{ tipologia: string; marca: string; quantita: number }> | null;
}

export const servizioOptions = [
  "Piantonamento",
  "Ronda",
  "Ispezione",
  "Intervento",
  "Trasporto Valori",
  "Scorta",
  "Antincendio",
  "Primo Soccorso",
  "Manutenzione",
  "Installazione",
  "Disinstallazione",
  "Sopralluogo",
  "Consegna",
  "Ritiro",
  "Formazione",
  "Altro",
];

export const esitoServizioOptions = [
  "Completato",
  "Incompleto",
  "Annullato",
  "Sospeso",
  "Rinviato",
];