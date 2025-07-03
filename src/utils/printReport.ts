import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format, parseISO, isValid } from 'date-fns';
import { it } from 'date-fns/locale';
import { showInfo, showError, showSuccess } from "@/utils/toast";
import { supabase } from "@/integrations/supabase/client";
import { fetchPuntiServizio, fetchPersonale, fetchOperatoriNetwork } from "@/lib/data-fetching"; // Import fetchPersonale and fetchOperatoriNetwork
import { PuntoServizio, Personale, OperatoreNetwork } from "@/lib/anagrafiche-data"; // Import Personale and OperatoreNetwork interfaces
import JsBarcode from 'jsbarcode'; // Import JsBarcode

// Define the structure of an alarm intervention report from Supabase
interface AllarmeIntervento {
  id: string;
  created_at: string;
  report_date: string;
  report_time: string;
  service_point_code: string;
  request_type: string;
  co_operator?: string;
  operator_client?: string;
  gpg_intervention?: string;
  service_outcome?: string;
  notes?: string;
  barcode?: string; // Added barcode field
  start_latitude?: number;
  start_longitude?: number;
  end_latitude?: number;
  end_longitude?: number;
}

const generateBarcodeImage = (text: string): string | null => {
  if (!text) return null;
  try {
    const canvas = document.createElement('canvas');
    JsBarcode(canvas, text, {
      format: "CODE128",
      displayValue: true,
      height: 50,
      width: 2,
      margin: 10,
    });
    return canvas.toDataURL("image/png");
  } catch (error: any) {
    console.error("Barcode generation error in PDF:", error);
    return null;
  }
};

export const generateSingleServiceReportPdfBlob = async (reportId: string): Promise<Blob | null> => {
  const { data: report, error } = await supabase
    .from('allarme_interventi')
    .select('*, start_latitude, start_longitude, end_latitude, end_longitude, barcode') // Explicitly select GPS and barcode fields
    .eq('id', reportId)
    .single();

  if (error) {
    showError(`Errore nel recupero del rapporto di allarme: ${error.message}`);
    console.error("Error fetching single alarm intervention report:", error);
    return null;
  }

  if (!report) {
    showError(`Rapporto di allarme con ID ${reportId} non trovato.`);
    return null;
  }

  // Fetch all necessary data for names in parallel
  const [
    puntiServizioList,
    allPersonaleList, // Fetch all personnel
    allOperatoriNetworkList // Fetch all network operators
  ] = await Promise.all([
    fetchPuntiServizio(),
    fetchPersonale(),
    fetchOperatoriNetwork()
  ]);

  // Create maps for quick lookup
  const servicePointMap = new Map<string, PuntoServizio>();
  puntiServizioList.forEach(p => {
    servicePointMap.set(p.id, p);
    if (p.codice_sicep) servicePointMap.set(p.codice_sicep, p);
    if (p.codice_cliente) servicePointMap.set(p.codice_cliente, p);
    if (p.nome_punto_servizio) servicePointMap.set(p.nome_punto_servizio, p);
  });

  const personnelMap = new Map<string, Personale>();
  allPersonaleList.forEach(p => personnelMap.set(p.id, p));

  const operatoriNetworkMap = new Map<string, OperatoreNetwork>();
  allOperatoriNetworkList.forEach(op => operatoriNetworkMap.set(op.id, op));

  const doc = new jsPDF();
  let y = 20;

  doc.setFontSize(18);
  doc.text("Dettagli Rapporto Intervento Allarme", 14, y);
  y += 10;

  doc.setFontSize(10);
  const servicePointName = servicePointMap.get(report.service_point_code)?.nome_punto_servizio || report.service_point_code || 'N/A';
  
  // Add checks for null/undefined/empty string before parsing
  const parsedCreatedAt = (report.created_at && typeof report.created_at === 'string') ? parseISO(report.created_at) : null;
  const parsedReportDate = (report.report_date && typeof report.report_date === 'string') ? parseISO(report.report_date) : null;

  // Get names for IDs
  const coOperatorName = report.co_operator ? `${personnelMap.get(report.co_operator)?.nome || ''} ${personnelMap.get(report.co_operator)?.cognome || ''}`.trim() : 'N/A';
  const operatorClientName = report.operator_client ? `${operatoriNetworkMap.get(report.operator_client)?.nome || ''} ${operatoriNetworkMap.get(report.operator_client)?.cognome || ''}`.trim() : 'N/A';
  const gpgInterventionName = report.gpg_intervention ? `${personnelMap.get(report.gpg_intervention)?.nome || ''} ${personnelMap.get(report.gpg_intervention)?.cognome || ''}`.trim() : 'N/A';


  doc.text(`ID Rapporto: ${report.id}`, 14, y);
  y += 7;
  doc.text(`Data Creazione: ${parsedCreatedAt && isValid(parsedCreatedAt) ? format(parsedCreatedAt, "PPP HH:mm", { locale: it }) : 'N/A'}`, 14, y);
  y += 7;
  doc.text(`Data Intervento: ${parsedReportDate && isValid(parsedReportDate) ? format(parsedReportDate, "PPP", { locale: it }) : 'N/A'}`, 14, y);
  y += 7;
  doc.text(`Ora Intervento: ${report.report_time || 'N/A'}`, 14, y);
  y += 7;

  doc.text(`Punto Servizio: ${servicePointName}`, 14, y);
  y += 7;
  doc.text(`Tipologia Richiesta: ${report.request_type || 'N/A'}`, 14, y);
  y += 7;
  doc.text(`Co-Operatore: ${coOperatorName}`, 14, y);
  y += 7;
  doc.text(`Operatore Cliente: ${operatorClientName}`, 14, y);
  y += 7;
  doc.text(`G.P.G. Intervento: ${gpgInterventionName}`, 14, y);
  y += 7;
  doc.text(`Esito Servizio: ${report.service_outcome || 'N/A'}`, 14, y);
  y += 7;

  if (report.start_latitude !== undefined && report.start_latitude !== null && report.start_longitude !== undefined && report.start_longitude !== null) {
    doc.text(`GPS Inizio Intervento: Lat ${report.start_latitude.toFixed(6)}, Lon ${report.start_longitude.toFixed(6)}`, 14, y);
    y += 7;
  }
  if (report.end_latitude !== undefined && report.end_latitude !== null && report.end_longitude !== undefined && report.end_longitude !== null) {
    doc.text(`GPS Fine Intervento: Lat ${report.end_latitude.toFixed(6)}, Lon ${report.end_longitude.toFixed(6)}`, 14, y);
    y += 7;
  }

  if (report.notes) {
    y += 5;
    doc.setFontSize(12);
    doc.text("Note:", 14, y);
    y += 5;
    doc.setFontSize(10);
    const splitNotes = doc.splitTextToSize(report.notes, 180);
    doc.text(splitNotes, 14, y);
    y += (splitNotes.length * 5);
  }

  if (report.barcode) {
    y += 5;
    doc.setFontSize(12);
    doc.text("Barcode:", 14, y);
    y += 5;
    const barcodeDataURL = generateBarcodeImage(report.barcode);
    if (barcodeDataURL) {
      doc.addImage(barcodeDataURL, 'PNG', 14, y, 100, 20);
      y += 25;
    } else {
      doc.setFontSize(10);
      doc.text(`Impossibile generare immagine per barcode: ${report.barcode}`, 14, y);
      y += 7;
    }
  }

  return doc.output('blob');
};

export const printSingleServiceReport = async (reportId: string) => {
  showInfo(`Generazione PDF per il rapporto di allarme ${reportId}...`);
  const pdfBlob = await generateSingleServiceReportPdfBlob(reportId);
  if (pdfBlob) {
    const url = URL.createObjectURL(pdfBlob);
    window.open(url, '_blank');
    showSuccess(`PDF del rapporto di allarme ${reportId} generato con successo!`);
  } else {
    showError("Impossibile generare il PDF per la stampa.");
  }
};