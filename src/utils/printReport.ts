import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { showInfo, showError, showSuccess } from "@/utils/toast";
import { supabase } from "@/integrations/supabase/client";
import { fetchPuntiServizio } from "@/lib/data-fetching"; // Import fetchPuntiServizio
import { PuntoServizio } from "@/lib/anagrafiche-data"; // Import PuntoServizio interface

// Define the structure of an alarm intervention report from Supabase
interface AllarmeIntervento {
  id: string;
  created_at: string;
  report_date: string; // ISO date string
  report_time: string; // HH:MM:SS string
  service_point_code: string;
  request_type: string;
  co_operator?: string;
  operator_client?: string;
  gpg_intervention?: string;
  service_outcome?: string;
  notes?: string;
  latitude?: number;
  longitude?: number;
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

  // Fetch all service points to map the code to a name
  const puntiServizioList = await fetchPuntiServizio();
  const servicePointMap = new Map<string, PuntoServizio>();
  puntiServizioList.forEach(p => {
    if (p.codice_sicep) servicePointMap.set(p.codice_sicep, p);
    if (p.codice_cliente) servicePointMap.set(p.codice_cliente, p);
    if (p.nome_punto_servizio) servicePointMap.set(p.nome_punto_servizio, p);
    servicePointMap.set(p.id, p); // Also map by ID for robustness
  });

  const doc = new jsPDF();
  let y = 20;

  doc.setFontSize(18);
  doc.text("Dettagli Rapporto Intervento Allarme", 14, y);
  y += 10;

  doc.setFontSize(10);
  doc.text(`ID Rapporto: ${report.id}`, 14, y);
  y += 7;
  doc.text(`Data Creazione: ${format(new Date(report.created_at), "PPP HH:mm", { locale: it })}`, 14, y);
  y += 7;
  doc.text(`Data Intervento: ${format(new Date(report.report_date), "PPP", { locale: it })}`, 14, y);
  y += 7;
  doc.text(`Ora Intervento: ${report.report_time}`, 14, y);
  y += 7;

  const servicePointName = servicePointMap.get(report.service_point_code)?.nome_punto_servizio || report.service_point_code || 'N/A';
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