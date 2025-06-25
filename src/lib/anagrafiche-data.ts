export interface Cliente {
  id: string;
  nome_cliente: string;
}

export interface Fornitore {
  id: string;
  nome_fornitore: string;
}

export const serviceTypeRateOptions: string[] = [
  "Piantonamento",
  "Servizi Fiduciari",
  "Ispezioni",
  "Bonifiche",
  "Gestione Chiavi",
  "Apertura/Chiusura",
];