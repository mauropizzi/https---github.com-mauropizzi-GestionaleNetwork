import { showInfo, showSuccess, showError } from "@/utils/toast";
import { RECIPIENT_EMAIL } from "@/lib/config";
import { supabase } from "@/integrations/supabase/client";

export const sendEmail = async (subject: string, body: string, isHtml: boolean = false) => {
  try {
    showInfo("Invio email in corso...");

    const payload: { to: string; subject: string; textBody?: string; htmlBody?: string } = {
      to: RECIPIENT_EMAIL,
      subject: subject,
    };

    if (isHtml) {
      payload.htmlBody = body;
    } else {
      payload.textBody = body;
    }

    const { data, error } = await supabase.functions.invoke('send-email', {
      body: payload,
    });

    if (error) {
      showError(`Errore durante l'invio dell'email: ${error.message}`);
      console.error("Error invoking send-email Edge Function:", error);
      return;
    }

    if (data && data.message) {
      showSuccess(`Email inviata a ${RECIPIENT_EMAIL}: ${data.message}`);
      console.log("Email sent successfully via Edge Function:", data);
    } else {
      showError("Risposta inattesa dall'invio dell'email.");
      console.error("Unexpected response from send-email Edge Function:", data);
    }
  } catch (err: any) {
    showError(`Si è verificato un errore imprevisto durante l'invio dell'email: ${err.message}`);
    console.error("Unexpected error in sendEmail utility:", err);
  }
};