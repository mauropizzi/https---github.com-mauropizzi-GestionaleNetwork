export function getUnitaMisuraForServizio(serviceType: string): string {
  switch (serviceType) {
    case "Piantonamento":
    case "Servizi Fiduciari":
      return "ora";

    case "Ispezioni":
    case "Bonifiche":
    case "Gestione Chiavi":
    case "Apertura/Chiusura":
    case "Intervento":
      return "intervento";

    case "Disponibilità Pronto Intervento":
    case "Videosorveglianza":
    case "Impianto Allarme":
    case "Bidirezionale":
    case "Monodirezionale":
    case "Tenuta Chiavi":
      return "mese";

    default:
      return "";
  }
}