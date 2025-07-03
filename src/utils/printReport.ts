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

interface ServizioRichiesto {
  id: string;
  start_date: string;
  start_time?: string | null;
  end_date?: string | null;
  end_time?: string | null;
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

const formatDateTimeForPdf = (dateTimeString: string | null | undefined): string => {
  if (!dateTimeString) return 'N/A';
  try {
    const date = parseISO(dateTimeString);
    if (isValid(date)) {
      return format(date, 'dd/MM/yyyy HH:mm', { locale: it });
    }
    return 'N/A (Data non valida)';
  } catch (e) {
    console.error("Error formatting date for PDF:", e);
    return 'N/A (Errore formato)';
  }
};

export const generateSingleServiceReportPdfBlob = async (reportId: string): Promise<Blob | null> => {
  const { data: report, error } = await supabase
    .from('allarme_interventi')
    .select(`
      id,
      created_at,
      report_date,
      report_time,
      service_point_code,
      request_type,
      co_operator,
      operator_client,
      gpg_intervention,
      service_outcome,
      notes,
      barcode,
      start_latitude,
      start_longitude,
      end_latitude,
      end_longitude
    `) // Explicitly select all fields needed
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

  // Fetch associated servizi_richiesti data
  const { data: serviziRichiesti, error: serviziError } = await supabase
    .from('servizi_richiesti')
    .select('start_date, start_time, end_date, end_time')
    .eq('id', reportId)
    .single();

  if (serviziError && serviziError.code !== 'PGRST116') { // PGRST116 means no rows found
    console.warn(`Warning: Could not fetch associated servizi_richiesti for report ID ${reportId}: ${serviziError.message}`);
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
  const interventionTime = servicePointMap.get(report.service_point_code)?.tempo_intervento || 'N/A';
  
  // Add checks for null/undefined/empty string before parsing
  const parsedCreatedAt = (report.created_at && typeof report.created_at === 'string') ? parseISO(report.created_at) : null;
  const parsedReportDate = (report.report_date && typeof report.report_date === 'string') ? parseISO(report.report_date) : null;

  // Get names for IDs
  const coOperatorName = report.co_operator ? `${personnelMap.get(report.co_operator)?.nome || ''} ${personnelMap.get(report.co_operator)?.cognome || ''}`.trim() : 'N/A';
  const operatorClientName = report.operator_client ? `${operatoriNetworkMap.get(report.operator_client)?.nome || ''} ${operatoriNetworkMap.get(report.operator_client)?.cognome || ''}`.trim() : 'N/A';
  const gpgInterventionName = report.gpg_intervention ? `${personnelMap.get(report.gpg_intervention)?.nome || ''} ${personnelMap.get(report.gpg_intervention)?.cognome || ''}`.trim() : 'N/A';

  // Construct full datetime strings for formatting
  const requestDateTimeFull = (report.report_date && report.report_time) ? `${report.report_date}T${report.report_time.substring(0, 5)}` : null;
  const startDateTimeFull = (serviziRichiesti?.start_date && serviziRichiesti?.start_time) ? `${serviziRichiesti.start_date}T${serviziRichiesti.start_time.substring(0, 5)}` : null;
  const endDateTimeFull = (serviziRichiesti?.end_date && serviziRichiesti?.end_time) ? `${serviziRichiesti.end_date}T${serviziRichiesti.end_time.substring(0, 5)}` : null;


  doc.text(`ID Rapporto: ${report.id}`, 14, y);
  y += 7;
  doc.text(`Data Creazione: ${parsedCreatedAt && isValid(parsedCreatedAt) ? format(parsedCreatedAt, "PPP HH:mm", { locale: it }) : 'N/A'}`, 14, y);
  y += 7;
  doc.text(`Punto Servizio: ${servicePointName}`, 14, y);
  y += 7;
  doc.text(`Intervento da effettuarsi ENTRO: ${interventionTime} minuti`, 14, y);
  y += 7;
  doc.text(`Tipologia Richiesta: ${report.request_type || 'N/A'}`, 14, y);
  y += 7;
  doc.text(`Co-Operatore: ${coOperatorName}`, 14, y);
  y += 7;
  doc.text(`Orario Richiesta C.O. Security Service: ${formatDateTimeForPdf(requestDateTimeFull)}`, 14, y);
  y += 7;
  if (report.start_latitude !== undefined && report.start_latitude !== null && report.start_longitude !== undefined && report.start_longitude !== null) {
    doc.text(`GPS Presa in Carico Richiesta: Lat ${report.start_latitude.toFixed(6)}, Lon ${report.start_longitude.toFixed(6)}`, 14, y);
    y += 7;
  }
  doc.text(`Orario Inizio Intervento: ${formatDateTimeForPdf(startDateTimeFull)}`, 14, y);
  y += 7;
  if (report.end_latitude !== undefined && report.end_latitude !== null && report.end_longitude !== undefined && report.end_longitude !== null) {
    doc.text(`GPS Fine Intervento: Lat ${report.end_latitude.toFixed(6)}, Lon ${report.end_longitude.toFixed(6)}`, 14, y);
    y += 7;
  }
  doc.text(`Orario Fine Intervento: ${formatDateTimeForPdf(endDateTimeFull)}`, 14, y);
  y += 7;
  doc.text(`Operatore Network: ${operatorClientName}`, 14, y);
  y += 7;
  doc.text(`G.P.G. Intervento: ${gpgInterventionName}`, 14, y);
  y += 7;
  doc.text(`Esito Servizio: ${report.service_outcome || 'N/A'}`, 14, y);
  y += 7;

  // Parse and display notes details
  if (report.notes) {
    const notesArray = report.notes.split('; ').map((s: string) => s.trim());
    let fullAccess = 'N/A';
    let vaultAccess = 'N/A';
    let anomaliesText = 'NO';
    let delayText = 'NO';
    let anomalyDescription = '';
    let delayNotes = '';

    notesArray.forEach((note: string) => {
      if (note.startsWith('Accesso Completo:')) {
        fullAccess = note.replace('Accesso Completo:', '').trim();
      } else if (note.startsWith('Accesso Caveau:')) {
        vaultAccess = note.replace('Accesso Caveau:', '').trim();
      } else if (note.startsWith('Anomalie:')) {
        anomaliesText = 'SI';
        anomalyDescription = note.replace('Anomalie:', '').trim();
      } else if (note.startsWith('Ritardo:')) {
        delayText = 'SI';
        delayNotes = note.replace('Ritardo:', '').trim();
      }
    });

    doc.text(`Accesso Completo: ${fullAccess}`, 14, y);
    y += 7;
    doc.text(`Accesso Caveau: ${vaultAccess}`, 14, y);
    y += 7;
    doc.text(`Anomalie Riscontrate: ${anomaliesText}`, 14, y);
    if (anomaliesText === 'SI' && anomalyDescription) {
      y += 5;
      doc.setFontSize(9);
      const splitAnomalyDesc = doc.splitTextToSize(`Descrizione Anomalie: ${anomalyDescription}`, 180);
      doc.text(splitAnomalyDesc, 18, y);
      y += (splitAnomalyDesc.length * 4);
      doc.setFontSize(10);
    }
    y += 7;
    doc.text(`Ritardo: ${delayText}`, 14, y);
    if (delayText === 'SI' && delayNotes) {
      y += 5;
      doc.setFontSize(9);
      const splitDelayNotes = doc.splitTextToSize(`Motivo Ritardo: ${delayNotes}`, 180);
      doc.text(splitDelayNotes, 18, y);
      y += (splitDelayNotes.length * 4);
      doc.setFontSize(10);
    }
    y += 7;
  } else {
    // If no notes, still display N/A for these fields
    doc.text(`Accesso Completo: N/A`, 14, y);
    y += 7;
    doc.text(`Accesso Caveau: N/A`, 14, y);
    y += 7;
    doc.text(`Anomalie Riscontrate: N/A`, 14, y);
    y += 7;
    doc.text(`Ritardo: N/A`, 14, y);
    y += 7;
  }

  if (report.barcode) {
    const barcodeDataURL = generateBarcodeImage(report.barcode);
    if (barcodeDataURL) {
      doc.text(`Barcode: ${report.barcode}`, 14, y);
      y += 5;
      doc.addImage(barcodeDataURL, 'PNG', 14, y, 100, 20);
      y += 25;
    } else {
      doc.text(`Barcode: ${report.barcode} (Impossibile generare immagine)`, 14, y);
      y += 7;
    }
  } else {
    doc.text(`Barcode: N/A`, 14, y);
    y += 7;
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