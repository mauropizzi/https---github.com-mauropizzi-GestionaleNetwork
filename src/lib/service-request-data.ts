// src/lib/service-request-data.ts

export interface ServiceRequest {
  id: string;
  type: string;
  client_id: string;
  service_point_id: string;
  fornitore_id?: string | null;
  start_date: string;
  start_time: string;
  end_date: string;
  end_time: string;
  status: string;
  notes?: string | null;
  calculated_cost: number;
  multiplier: number;
  created_at?: string;
  updated_at?: string;
  // Relations (fetched via join)
  clienti?: { nome_cliente: string } | null;
  punti_servizio?: { nome_punto_servizio: string; id_cliente: string; clienti?: { nome_cliente: string } | null } | null;
  fornitori?: { nome: string } | null;
}