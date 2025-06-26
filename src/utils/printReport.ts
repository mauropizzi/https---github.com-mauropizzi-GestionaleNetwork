import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format, isValid, parseISO } from 'date-fns'; // Import parseISO and isValid
import { it } from 'date-fns/locale';
import { showInfo, showError, showSuccess } from "@/utils/toast";
import { supabase } from "@/integrations/supabase/client";
import { servicePointsData } from "@/lib/centrale-data";

// Define the structure of an alarm intervention report from Supabase
interface AllarmeIntervento {
  id: string;
  created_at: string | null; // Can be null
  report_date: string; // ISO date string, but let's treat it carefully
  report_time: string; // HH:MM:SS string
  service_point_code: string;
  request_type: string;
  co_operator?: string;
  operator_client?: string;
  gpg_intervention?: string;
  service_outcome?: string;
  notes?: string;
}

export const printSingleServiceReport = async (reportId: string) => {
  showInfo(`Generazione PDF per il rapporto di allarme ${reportId}...`);

  const { data: report, error } = await supabase
    .from('allarme_interventi') // Fetch from the correct table
    .select('*')
    .eq('id', reportId)
    .single();

  if (error) {
    showError(`Errore nel recupero del rapporto di allarme: ${error.message}`);
    console.error("Error fetching single alarm intervention report:", error);
    return;
  }

  if (!report) {
    showError(`Rapporto di allarme con ID ${reportId} non trovato.`);
    return;
  }

  const doc = new jsPDF();
  let y = 20;

  doc.setFontSize(18);
  doc.text("Dettagli Rapporto Intervento Allarme", 14, y);
  y += 10;

  doc.setFontSize(10);

  // Handle created_at - it can be null
  const createdAtDate = report.created_at ? parseISO(report.created_at) : null;
  doc.text(`Data Creazione: ${createdAtDate && isValid(createdAtDate) ? format(createdAtDate, "PPP HH:mm", { locale: it }) : 'N/A'}`, 14, y);
  y += 7;

  // Handle report_date - it should not be null based on schema, but still good to validate
  const reportDateDate = parseISO(report.report_date);
  doc.text(`Data Intervento: ${isValid(reportDateDate) ? format(reportDateDate, "PPP", { locale: it }) : 'N/A'}`, 14, y);
  y += 7;

  doc.text(`Ora Intervento: ${report.report_time}`, 14, y);
  y += 7;

  const servicePointName = servicePointsData.find(sp => sp.code === report.service_point_code)?.name || report.service_point_code || 'N/A';
  doc.text(`Punto Servizio: ${servicePointName}`, 14, y);
  y += 7;
  doc.text(`Tipologia Richiesta: ${report.request_type}`, 14, y);
  y += 7;
  doc.text(`Co-Operatore: ${report.co_operator || 'N/A'}`, 14, y);
  y += 7;
  doc.text(`Operatore Cliente: ${report.operator_client || 'N/A'}`, 14, y);
  y += 7;
  doc.text(`G.P.G. Intervento: ${report.gpg_intervention || 'N/A'}`, 14, y);
  y += 7;
  doc.text(`Esito Servizio: ${report.service_outcome || 'N/A'}`, 14, y);
  y += 7;

  if (report.notes) {
    y += 5;
    doc.setFontSize(12);
    doc.text("Note:", 14, y);
    y += 5;
    doc.setFontSize(10);
    const splitNotes = doc.splitTextToSize(report.notes, 180); // Max width 180mm
    doc.text(splitNotes, 14, y);
    y += (splitNotes.length * 5); // Adjust y for multiple lines
  }

  doc.output('dataurlnewwindow');
  showSuccess(`PDF del rapporto di allarme ${reportId} generato con successo!`);
};