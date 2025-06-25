import { showInfo } from "@/utils/toast";
import { RECIPIENT_EMAIL } from "@/lib/config";

export const sendEmail = (subject: string, body: string) => {
  // In un'applicazione reale, questa funzione invierebbe i dati a un backend
  // che si occuperebbe dell'invio effettivo dell'email per motivi di sicurezza
  // e per evitare l'esposizione di credenziali.
  console.log("Simulazione invio email:");
  console.log("Destinatario:", RECIPIENT_EMAIL);
  console.log("Oggetto:", subject);
  console.log("Corpo:", body);
  showInfo(`Email inviata a ${RECIPIENT_EMAIL} (simulato).`);
};