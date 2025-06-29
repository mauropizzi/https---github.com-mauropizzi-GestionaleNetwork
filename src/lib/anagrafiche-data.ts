export interface Cliente {
  id: string;
  nome_cliente: string;
}

export interface PuntoServizio {
  id: string;
  nome_punto_servizio: string;
  id_cliente: string; // Assuming a link back to Cliente
}

export interface Fornitore {
  id: string;
  nome_fornitore: string;
}

export interface Personale {
  id: string;
  nome: string;
  cognome: string;
  ruolo: string;
}

export const serviceTypeRateOptions: string[] = [
  "Piantonamento",
  "Servizi Fiduciari",
  "Ispezioni",
  "Bonifiche",
  "Gestione Chiavi",
  "Apertura/Chiusura",
];