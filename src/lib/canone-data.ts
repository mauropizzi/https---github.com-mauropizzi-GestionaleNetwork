// src/lib/canone-data.ts

export interface Canone {
  id: string;
  data_inizio: string;
  data_fine: string;
  id_punto_servizio: string;
  id_fornitore: string;
  id_cliente: string;
  importo: number;
  status: string; // e.g., "attivo", "scaduto", "pagato"
  created_at?: string;
  updated_at?: string;
  // Relations (fetched via join)
  clienti?: { nome_cliente: string } | null;
  punti_servizio?: { nome_punto_servizio: string } | null;
  fornitori?: { nome: string } | null;
}