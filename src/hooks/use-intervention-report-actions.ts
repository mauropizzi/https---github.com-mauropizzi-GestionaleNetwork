import { format, parseISO, isValid } from 'date-fns';
import { it } from 'date-fns/locale';
import JsBarcode from 'jsbarcode';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { showSuccess, showError, showInfo } from "@/utils/toast";
import { sendEmail } from "@/utils/email";
import { Personale, OperatoreNetwork, PuntoServizio } from '@/lib/anagrafiche-data';

interface InterventionFormData {
  servicePoint: string;
  requestType: string;
  coOperator: string;
  requestTime: string;
  startTime: string;
  endTime: string;
  fullAccess: 'si' | 'no' | undefined;
  vaultAccess: 'si' | 'no' | undefined;
  operatorClient: string;
  gpgIntervention: string;
  anomalies: 'si' | 'no' | undefined;
  anomalyDescription: string;
  delay: 'si' | 'no' | undefined;
  delayNotes: string;
  serviceOutcome: string;
  barcode: string;
  startLatitude: number | undefined;
  startLongitude: number | undefined;
  endLatitude: number | undefined;
  endLongitude: number | undefined;
}

interface UseInterventionReportActionsProps {
  formData: InterventionFormData;
  puntiServizioList: PuntoServizio[];
  coOperatorsPersonnel: Personale[];
  operatoriNetworkList: OperatoreNetwork[];
  pattugliaPersonale: Personale[];
}

export const useInterventionReportActions = ({
  formData,
  puntiServizioList,
  coOperatorsPersonnel,
  operatoriNetworkList,
  pattugliaPersonale,
}: UseInterventionReportActionsProps) => {

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
      showError(`Errore nella generazione del codice a barre: ${error.message}`);
      console.error("Barcode generation error:", error);
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

  const generatePdfBlob = (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const doc = new jsPDF();
      let y = 20;

      doc.setFontSize(18);
      doc.text("Rapporto Intervento Centrale Operativa", 14, y);
      y += 10;

      doc.setFontSize(10);
      const selectedServicePoint = puntiServizioList.find(p => p.id === formData.servicePoint);
      const servicePointName = selectedServicePoint?.nome_punto_servizio || 'N/A';
      const interventionTime = selectedServicePoint?.tempo_intervento || 'N/A';
      const selectedCoOperatorForPdf = coOperatorsPersonnel.find(op => op.id === formData.coOperator);
      const coOperatorName = selectedCoOperatorForPdf ? `${selectedCoOperatorForPdf.nome} ${selectedCoOperatorForPdf.cognome || ''}` : 'N/A';

      doc.text(`Punto Servizio: ${servicePointName}`, 14, y);
      y += 7;
      doc.text(`Intervento da effettuarsi ENTRO: ${interventionTime} minuti`, 14, y);
      y += 7;
      doc.text(`Tipologia Servizio Richiesto: ${formData.requestType}`, 14, y);
      y += 7;
      doc.text(`Operatore C.O. Security Service: ${coOperatorName}`, 14, y);
      y += 7;
      doc.text(`Orario Richiesta C.O. Security Service: ${formatDateTimeForPdf(formData.requestTime)}`, 14, y);
      y += 7;
      if (formData.startLatitude !== undefined && formData.startLongitude !== undefined) {
        doc.text(`Posizione GPS Inizio Intervento: Lat ${formData.startLatitude.toFixed(6)}, Lon ${formData.startLongitude.toFixed(6)}`, 14, y);
        y += 7;
      }
      doc.text(`Orario Inizio Intervento: ${formatDateTimeForPdf(formData.startTime)}`, 14, y);
      y += 7;
      if (formData.endLatitude !== undefined && formData.endLongitude !== undefined) {
        doc.text(`Posizione GPS Fine Intervento: Lat ${formData.endLatitude.toFixed(6)}, Lon ${formData.endLongitude.toFixed(6)}`, 14, y);
        y += 7;
      }
      doc.text(`Orario Fine Intervento: ${formatDateTimeForPdf(formData.endTime)}`, 14, y);
      y += 7;
      doc.text(`Accesso Completo: ${formData.fullAccess?.toUpperCase() || 'N/A'}`, 14, y);
      y += 7;
      doc.text(`Accesso Caveau: ${formData.vaultAccess?.toUpperCase() || 'N/A'}`, 14, y);
      y += 7;
      const selectedOperatorNetworkForPdf = operatoriNetworkList.find(op => op.id === formData.operatorClient);
      doc.text(`Operatore Network: ${selectedOperatorNetworkForPdf ? `${selectedOperatorNetworkForPdf.nome} ${selectedOperatorNetworkForPdf.cognome || ''}` : 'N/A'}`, 14, y);
      y += 7;
      const gpgInterventionName = pattugliaPersonale.find(p => p.id === formData.gpgIntervention);
      doc.text(`G.P.G. Intervento: ${gpgInterventionName ? `${gpgInterventionName.nome} ${gpgInterventionName.cognome}` : 'N/A'}`, 14, y);
      y += 7;
      doc.text(`Anomalie Riscontrate: ${formData.anomalies?.toUpperCase() || 'N/A'}`, 14, y);
      if (formData.anomalies === 'si' && formData.anomalyDescription) {
        y += 5;
        doc.setFontSize(9);
        const splitAnomalyDesc = doc.splitTextToSize(`Descrizione Anomalie: ${formData.anomalyDescription}`, 180);
        doc.text(splitAnomalyDesc, 18, y);
        y += (splitAnomalyDesc.length * 4);
        doc.setFontSize(10);
      }
      y += 7;
      doc.text(`Ritardo: ${formData.delay?.toUpperCase() || 'N/A'}`, 14, y);
      if (formData.delay === 'si' && formData.delayNotes) {
        y += 5;
        doc.setFontSize(9);
        const splitDelayNotes = doc.splitTextToSize(`Motivo Ritardo: ${formData.delayNotes}`, 180);
        doc.text(splitDelayNotes, 18, y);
        y += (splitDelayNotes.length * 4);
        doc.setFontSize(10);
      }
      y += 7;
      doc.text(`Esito Evento: ${formData.serviceOutcome || 'N/A'}`, 14, y);
      y += 7;

      if (formData.barcode) {
        const barcodeDataURL = generateBarcodeImage(formData.barcode);
        if (barcodeDataURL) {
          doc.text(`Barcode: ${formData.barcode}`, 14, y);
          y += 5;
          doc.addImage(barcodeDataURL, 'PNG', 14, y, 100, 20);
          y += 25;
        } else {
          doc.text(`Barcode: ${formData.barcode} (Impossibile generare immagine)`, 14, y);
          y += 7;
        }
      } else {
        doc.text(`Barcode: N/A`, 14, y);
        y += 7;
      }

      const pdfBlob = doc.output('blob');
      resolve(pdfBlob);
    });
  };

  const handlePrintPdf = async () => {
    showInfo("Generazione PDF per la stampa...");
    const pdfBlob = await generatePdfBlob();
    if (pdfBlob) {
      const url = URL.createObjectURL(pdfBlob);
      window.open(url, '_blank');
      showSuccess("PDF generato con successo!");
    } else {
      showError("Impossibile generare il PDF.");
    }
  };

  const handleEmail = async () => {
    const selectedServicePoint = puntiServizioList.find(p => p.id === formData.servicePoint);
    const servicePointName = selectedServicePoint?.nome_punto_servizio || 'N/A';
    const subject = `Rapporto Intervento Centrale Operativa - ${servicePointName} - ${format(new Date(), 'dd/MM/yyyy HH:mm')}`;
    const textBody = "Si trasmettono in allegato i dettagli del servizio richiesto.\n\nBuon lavoro.";
    
    showInfo("Generazione PDF per l'allegato email...");
    const pdfBlob = await generatePdfBlob();

    if (pdfBlob) {
      const reader = new FileReader();
      reader.readAsDataURL(pdfBlob);
      reader.onloadend = () => {
        const base64data = reader.result?.toString().split(',')[1];
        if (base64data) {
          sendEmail(subject, textBody, false, {
            filename: `Rapporto_Intervento_Centrale_Operativa_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`,
            content: base64data,
            contentType: 'application/pdf'
          });
        } else {
          showError("Errore nella conversione del PDF in Base64.");
        }
      };
      reader.onerror = () => {
        showError("Errore nella lettura del file PDF.");
      };
    } else {
      showError("Impossibile generare il PDF per l'allegato.");
    }
  };

  return {
    handlePrintPdf,
    handleEmail,
  };
};