import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format, parseISO, isValid } from 'date-fns';
import { it } from 'date-fns/locale';
import { showInfo, showError, showSuccess } from "@/utils/toast";
import { supabase } from "@/integrations/supabase/client";
import { fetchPuntiServizio, fetchPersonale, fetchOperatoriNetwork } from "@/lib/data-fetching";
import { PuntoServizio, Personale, OperatoreNetwork, RichiestaManutenzione } from "@/lib/anagrafiche-data"; // Import RichiestaManutenzione
import JsBarcode from 'jsbarcode';

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
  barcode?: string;
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

// Define the structure of a dotazioni report from Supabase
interface RapportoServizio {
  id: string;
  created_at: string;
  service_date: string;
  employee_id: string;
  service_location: string;
  service_location_id?: string | null; // Added for consistency
  service_type: string;
  start_time: string;
  end_time: string;
  vehicle_make_model: string;
  vehicle_plate: string;
  start_km: number;
  end_km: number;
  vehicle_initial_state: string;
  danni_veicolo?: string | null;
  vehicle_anomalies?: string | null;
  gps: boolean;
  radio_vehicle: boolean;
  swiveling_lamp: boolean;
  radio_portable: boolean;
  flashlight: boolean;
  extinguisher: boolean;
  spare_tire: boolean;
  high_visibility_vest: boolean;
  personale?: { nome: string; cognome: string } | null; // For joined data
}

// Define a type for the form values for dotazioni report
interface DotazioniFormValues {
  serviceDate: Date;
  employeeId: string;
  servicePointId: string;
  serviceType: string;
  startTime: string;
  endTime: string;
  vehicleMakeModel: string;
  vehiclePlate: string;
  startKm: number;
  endKm: number;
  vehicleInitialState: string;
  danniVeicolo: string | null;
  vehicleAnomalies: string | null;
  gps: 'si' | 'no';
  radioVehicle: 'si' | 'no';
  swivelingLamp: 'si' | 'no';
  radioPortable: 'si' | 'no';
  flashlight: 'si' | 'no';
  extinguisher: 'si' | 'no';
  spareTire: 'si' | 'no';
  highVisibilityVest: 'si' | 'no';
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
    `)
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

  const { data: serviziRichiesti, error: serviziError } = await supabase
    .from('servizi_richiesti')
    .select('start_date, start_time, end_date, end_time')
    .eq('id', reportId)
    .single();

  if (serviziError && serviziError.code !== 'PGRST116') {
    console.warn(`Warning: Could not fetch associated servizi_richiesti for report ID ${reportId}: ${serviziError.message}`);
  }

  const [
    puntiServizioList,
    allPersonaleList,
    allOperatoriNetworkList
  ] = await Promise.all([
    fetchPuntiServizio(),
    fetchPersonale(),
    fetchOperatoriNetwork()
  ]);

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
  
  const parsedCreatedAt = (report.created_at && typeof report.created_at === 'string') ? parseISO(report.created_at) : null;

  const coOperatorName = report.co_operator ? `${personnelMap.get(report.co_operator)?.nome || ''} ${personnelMap.get(report.co_operator)?.cognome || ''}`.trim() : 'N/A';
  const operatorClientName = report.operator_client ? `${operatoriNetworkMap.get(report.operator_client)?.nome || ''} ${operatoriNetworkMap.get(report.operator_client)?.cognome || ''}`.trim() : 'N/A';
  const gpgInterventionName = report.gpg_intervention ? `${personnelMap.get(report.gpg_intervention)?.nome || ''} ${personnelMap.get(report.gpg_intervention)?.cognome || ''}`.trim() : 'N/A';

  const requestDateTimeFull = (report.report_date && report.report_time) ? `${report.report_date}T${report.report_time.substring(0, 5)}` : null;
  const startDateTimeFull = (serviziRichiesti?.start_date && serviziRichiesti?.start_time) ? `${serviziRichiesti.start_date}T${serviziRichiesti.start_time.substring(0, 5)}` : null;
  const endDateTimeFull = (serviziRichiesti?.end_date && serviziRichiesti?.end_time) ? `${serviziRichiesti.end_date}T${serviziRichiesti.end_time.substring(0, 5)}` : null;

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
  doc.text(`Orario Inizio Intervento: ${formatDateTimeForPdf(startDateTimeFull)}`, 14, y);
  y += 7;
  doc.text(`Orario Fine Intervento: ${formatDateTimeForPdf(endDateTimeFull)}`, 14, y);
  y += 7;
  doc.text(`Operatore Network: ${operatorClientName}`, 14, y);
  y += 7;
  doc.text(`G.P.G. Intervento: ${gpgInterventionName}`, 14, y);
  y += 7;
  doc.text(`Esito Servizio: ${report.service_outcome || 'N/A'}`, 14, y);
  y += 7;

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
    }
    y += 7;
  } else {
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

export const generateDotazioniReportPdfBlob = async (
  reportId?: string,
  formData?: DotazioniFormValues,
  personaleList?: Personale[],
  puntiServizioList?: PuntoServizio[]
): Promise<Blob | null> => {
  let report: RapportoServizio | null = null;
  let employeeFullName: string = 'N/A';
  let servicePointName: string = 'N/A';

  if (reportId) {
    // Fetch data from DB for existing report
    const { data, error } = await supabase
      .from('rapporti_servizio')
      .select(`
        *,
        personale(nome, cognome)
      `)
      .eq('id', reportId)
      .single();

    if (error) {
      showError(`Errore nel recupero del rapporto dotazioni di servizio: ${error.message}`);
      console.error("Error fetching single dotazioni report:", error);
      return null;
    }
    report = data;
    employeeFullName = report?.personale ? `${report.personale.nome} ${report.personale.cognome}` : 'N/A';
    servicePointName = report?.service_location || 'N/A'; // Use service_location from DB
  } else if (formData && personaleList && puntiServizioList) {
    // Use provided form data for new report
    report = {
      id: 'NEW_REPORT', // Placeholder ID
      created_at: new Date().toISOString(),
      service_date: format(formData.serviceDate, 'yyyy-MM-dd'),
      employee_id: formData.employeeId,
      service_location_id: formData.servicePointId,
      service_location: puntiServizioList.find(p => p.id === formData.servicePointId)?.nome_punto_servizio || 'N/A',
      service_type: formData.serviceType,
      start_time: formData.startTime,
      end_time: formData.endTime,
      vehicle_make_model: formData.vehicleMakeModel,
      vehicle_plate: formData.vehiclePlate,
      start_km: formData.startKm,
      end_km: formData.endKm,
      vehicle_initial_state: formData.vehicleInitialState,
      danni_veicolo: formData.danniVeicolo,
      vehicle_anomalies: formData.vehicleAnomalies,
      gps: formData.gps === 'si',
      radio_vehicle: formData.radioVehicle === 'si',
      swiveling_lamp: formData.swivelingLamp === 'si',
      radio_portable: formData.radioPortable === 'si',
      flashlight: formData.flashlight === 'si',
      extinguisher: formData.extinguisher === 'si',
      spare_tire: formData.spareTire === 'si',
      high_visibility_vest: formData.highVisibilityVest === 'si',
    };
    employeeFullName = personaleList.find(p => p.id === formData.employeeId)?.nome + ' ' + (personaleList.find(p => p.id === formData.employeeId)?.cognome || '') || 'N/A';
    servicePointName = puntiServizioList.find(p => p.id === formData.servicePointId)?.nome_punto_servizio || 'N/A';
  } else {
    showError("Dati insufficienti per generare il PDF del rapporto dotazioni di servizio.");
    return null;
  }

  if (!report) {
    showError(`Rapporto dotazioni di servizio non trovato.`);
    return null;
  }

  const doc = new jsPDF();
  let y = 20;

  doc.setFontSize(18);
  doc.text("Rapporto Dotazioni di Servizio", 14, y);
  y += 10;

  doc.setFontSize(10);

  doc.text(`Data Servizio: ${format(parseISO(report.service_date), 'PPP', { locale: it })}`, 14, y);
  y += 7;
  doc.text(`Dipendente: ${employeeFullName}`, 14, y);
  y += 7;
  doc.text(`Punto Servizio: ${servicePointName}`, 14, y);
  y += 7;
  doc.text(`Tipo Servizio: ${report.service_type || 'N/A'}`, 14, y);
  y += 7;
  doc.text(`Orario Inizio: ${report.start_time || 'N/A'}`, 14, y);
  y += 7;
  doc.text(`Orario Fine: ${report.end_time || 'N/A'}`, 14, y);
  y += 7;
  doc.text(`Veicolo: ${report.vehicle_make_model || 'N/A'} - Targa: ${report.vehicle_plate || 'N/A'}`, 14, y);
  y += 7;
  doc.text(`KM Iniziali: ${report.start_km !== null ? report.start_km : 'N/A'} - KM Finali: ${report.end_km !== null ? report.end_km : 'N/A'}`, 14, y);
  y += 7;
  doc.text(`Stato Veicolo: ${report.vehicle_initial_state || 'N/A'}`, 14, y);
  y += 7;
  doc.text(`Danni Veicolo: ${report.danni_veicolo || 'N/A'}`, 14, y);
  y += 7;
  if (report.vehicle_anomalies) {
    doc.text(`Anomalie Veicolo: ${report.vehicle_anomalies}`, 14, y);
    y += 7;
  }

  y += 5;
  doc.setFontSize(12);
  doc.text("Dotazioni Controllate:", 14, y);
  y += 5;
  doc.setFontSize(10);
  doc.text(`GPS: ${report.gps ? 'SI' : 'NO'}`, 14, y);
  y += 5;
  doc.text(`Radio Veicolare: ${report.radio_vehicle ? 'SI' : 'NO'}`, 14, y);
  y += 5;
  doc.text(`Faro Girevole: ${report.swiveling_lamp ? 'SI' : 'NO'}`, 14, y);
  y += 5;
  doc.text(`Radio Portatile: ${report.radio_portable ? 'SI' : 'NO'}`, 14, y);
  y += 5;
  doc.text(`Estintore: ${report.extinguisher ? 'SI' : 'NO'}`, 14, y);
  y += 5;
  doc.text(`Ruota di Scorta: ${report.spare_tire ? 'SI' : 'NO'}`, 14, y);
  y += 5;
  doc.text(`Giubbotto Alta Visibilità: ${report.high_visibility_vest ? 'SI' : 'NO'}`, 14, y);
  y += 10;

  return doc.output('blob');
};

export const printDotazioniReport = async (reportId: string) => {
  showInfo(`Generazione PDF per il rapporto dotazioni di servizio ${reportId}...`);
  const pdfBlob = await generateDotazioniReportPdfBlob(reportId);
  if (pdfBlob) {
    const url = URL.createObjectURL(pdfBlob);
    window.open(url, '_blank');
    showSuccess(`PDF del rapporto dotazioni di servizio ${reportId} generato con successo!`);
  } else {
    showError("Impossibile generare il PDF per la stampa.");
  }
};

export const generateMaintenanceReportPdfBlob = async (request: RichiestaManutenzione): Promise<Blob | null> => {
  const doc = new jsPDF();
  let y = 20;

  doc.setFontSize(18);
  doc.text("Richiesta di Manutenzione Veicolo", 14, y);
  y += 10;

  doc.setFontSize(10);
  doc.text(`ID Richiesta: ${request.id}`, 14, y);
  y += 7;
  doc.text(`Data Richiesta: ${format(parseISO(request.requested_at), "PPP HH:mm", { locale: it })}`, 14, y);
  y += 7;
  doc.text(`Punto Servizio: ${request.service_point?.nome_punto_servizio || 'N/A'}`, 14, y);
  y += 7;
  doc.text(`Targa Veicolo: ${request.vehicle_plate || 'N/A'}`, 14, y);
  y += 7;
  doc.text(`Richiesto da: ${request.requested_by_employee ? `${request.requested_by_employee.nome} ${request.requested_by_employee.cognome}` : 'N/A'}`, 14, y);
  y += 7;
  doc.text(`Priorità: ${request.priority || 'N/A'}`, 14, y);
  y += 7;
  doc.text(`Stato: ${request.status || 'N/A'}`, 14, y);
  y += 7;

  if (request.issue_description) {
    y += 5;
    doc.setFontSize(12);
    doc.text("Descrizione Problema:", 14, y);
    y += 5;
    doc.setFontSize(10);
    const splitDescription = doc.splitTextToSize(request.issue_description, 180);
    doc.text(splitDescription, 14, y);
    y += (splitDescription.length * 4);
  }

  return doc.output('blob');
};