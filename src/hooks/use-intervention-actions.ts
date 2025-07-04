import { useCallback } from 'react';
import { format, parseISO, isValid } from 'date-fns';
import { it } from 'date-fns/locale';
import JsBarcode from 'jsbarcode';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { UseFormTrigger, UseFormSetError, UseFormClearErrors } from 'react-hook-form'; // Import types

import { showSuccess, showError, showInfo } from "@/utils/toast";
import { sendEmail } from "@/utils/email";
import { supabase } from '@/integrations/supabase/client';
import { calculateServiceCost } from '@/lib/data-fetching';
import { Personale, OperatoreNetwork, PuntoServizio } from '@/lib/anagrafiche-data';
import { z } from 'zod'; // Import z for schema validation

// Re-define the schema here or import it if it's shared
const interventionFormSchema = z.object({
  servicePoint: z.string().uuid("Seleziona un punto servizio valido.").nonempty("Il punto servizio è richiesto."),
  requestType: z.string().min(1, "La tipologia di servizio è richiesta."),
  coOperator: z.string().uuid("Seleziona un operatore C.O. valido.").nonempty("L'operatore C.O. è richiesto."),
  requestTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato ora non valido (HH:MM)."),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato ora non valido (HH:MM).").optional().nullable(),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato ora non valido (HH:MM).").optional().nullable(),
  fullAccess: z.enum(['si', 'no'], { required_error: "L'accesso completo è richiesto." }).optional().nullable(),
  vaultAccess: z.enum(['si', 'no'], { required_error: "L'accesso caveau è richiesto." }).optional().nullable(),
  operatorNetworkId: z.string().uuid("Seleziona un operatore network valido.").optional().nullable(),
  gpgIntervention: z.string().uuid("Seleziona un G.P.G. valido.").nonempty("Il G.P.G. intervento è richiesto."),
  anomalies: z.enum(['si', 'no'], { required_error: "Indica se ci sono anomalie." }).optional().nullable(),
  anomalyDescription: z.string().optional().nullable(),
  delay: z.enum(['si', 'no'], { required_error: "Indica se c'è stato un ritardo." }).optional().nullable(),
  delayNotes: z.string().optional().nullable(),
  serviceOutcome: z.string().min(1, "L'esito dell'evento è richiesto.").optional().nullable(),
  barcode: z.string().min(1, "Il barcode è richiesto."),
  startLatitude: z.coerce.number().optional().nullable(),
  startLongitude: z.coerce.number().optional().nullable(),
  endLatitude: z.coerce.number().optional().nullable(),
  endLongitude: z.coerce.number().optional().nullable(),
});

type InterventionFormState = z.infer<typeof interventionFormSchema>;

interface UseInterventionActionsProps {
  puntiServizioList: PuntoServizio[];
  coOperatorsPersonnel: Personale[];
  operatoriNetworkList: OperatoreNetwork[];
  pattugliaPersonale: Personale[];
  eventId?: string;
  isPublicMode?: boolean;
  onSaveSuccess?: () => void;
  resetForm: () => void;
  triggerValidation: UseFormTrigger<InterventionFormState>; // Add triggerValidation
  setError: UseFormSetError<InterventionFormState>; // Add setError
  clearErrors: UseFormClearErrors<InterventionFormState>; // Add clearErrors
  getValues: () => InterventionFormState; // Add getValues to access current form state
}

export const useInterventionActions = ({
  puntiServizioList,
  coOperatorsPersonnel,
  operatoriNetworkList,
  pattugliaPersonale,
  eventId,
  isPublicMode = false,
  onSaveSuccess,
  resetForm,
  triggerValidation,
  setError,
  clearErrors,
  getValues, // Destructure getValues
}: UseInterventionActionsProps) => {

  const generateBarcodeImage = useCallback((text: string): string | null => {
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
  }, []);

  const formatDateTimeForPdf = useCallback((dateTimeString: string | null | undefined): string => {
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
  }, []);

  const generatePdfBlob = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const doc = new jsPDF();
      let y = 20;

      const currentFormData = getValues(); // Call the function to get latest values

      doc.setFontSize(18);
      doc.text("Rapporto Intervento Centrale Operativa", 14, y);
      y += 10;

      doc.setFontSize(10);
      const selectedServicePoint = puntiServizioList.find(p => p.id === currentFormData.servicePoint);
      const servicePointName = selectedServicePoint?.nome_punto_servizio || 'N/A';
      const interventionTime = selectedServicePoint?.tempo_intervento || 'N/A';
      const selectedCoOperatorForPdf = coOperatorsPersonnel.find(op => op.id === currentFormData.coOperator);
      const coOperatorName = selectedCoOperatorForPdf ? `${selectedCoOperatorForPdf.nome} ${selectedCoOperatorForPdf.cognome || ''}` : 'N/A';

      doc.text(`Punto Servizio: ${servicePointName}`, 14, y);
      y += 7;
      doc.text(`Intervento da effettuarsi ENTRO: ${interventionTime} minuti`, 14, y);
      y += 7;
      doc.text(`Tipologia Servizio Richiesto: ${currentFormData.requestType}`, 14, y);
      y += 7;
      doc.text(`Operatore C.O. Security Service: ${coOperatorName}`, 14, y);
      y += 7;
      doc.text(`Orario Richiesta C.O. Security Service: ${formatDateTimeForPdf(currentFormData.requestTime)}`, 14, y);
      y += 7;
      if (currentFormData.startLatitude !== undefined && currentFormData.startLatitude !== null && currentFormData.startLongitude !== undefined && currentFormData.startLongitude !== null) {
        doc.text(`Posizione GPS Inizio Intervento: Lat ${currentFormData.startLatitude.toFixed(6)}, Lon ${currentFormData.startLongitude.toFixed(6)}`, 14, y);
        y += 7;
      }
      doc.text(`Orario Inizio Intervento: ${formatDateTimeForPdf(currentFormData.startTime)}`, 14, y);
      y += 7;
      if (currentFormData.endLatitude !== undefined && currentFormData.endLatitude !== null && currentFormData.endLongitude !== undefined && currentFormData.endLongitude !== null) {
        doc.text(`Posizione GPS Fine Intervento: Lat ${currentFormData.endLatitude.toFixed(6)}, Lon ${currentFormData.endLongitude.toFixed(6)}`, 14, y);
        y += 7;
      }
      doc.text(`Orario Fine Intervento: ${formatDateTimeForPdf(currentFormData.endTime)}`, 14, y);
      y += 7;
      doc.text(`Accesso Completo: ${currentFormData.fullAccess?.toUpperCase() || 'N/A'}`, 14, y);
      y += 7;
      doc.text(`Accesso Caveau: ${currentFormData.vaultAccess?.toUpperCase() || 'N/A'}`, 14, y);
      y += 7;
      const selectedOperatorNetworkForPdf = operatoriNetworkList.find(op => op.id === currentFormData.operatorNetworkId);
      doc.text(`Operatore Network: ${selectedOperatorNetworkForPdf ? `${selectedOperatorNetworkForPdf.nome} ${selectedOperatorNetworkForPdf.cognome || ''}` : 'N/A'}`, 14, y);
      y += 7;
      const gpgInterventionName = pattugliaPersonale.find(p => p.id === currentFormData.gpgIntervention);
      doc.text(`G.P.G. Intervento: ${gpgInterventionName ? `${gpgInterventionName.nome} ${gpgInterventionName.cognome}` : 'N/A'}`, 14, y);
      y += 7;
      doc.text(`Anomalie Riscontrate: ${currentFormData.anomalies?.toUpperCase() || 'N/A'}`, 14, y);
      if (currentFormData.anomalies === 'si' && currentFormData.anomalyDescription) {
        y += 5;
        doc.setFontSize(9);
        const splitAnomalyDesc = doc.splitTextToSize(`Descrizione Anomalie: ${currentFormData.anomalyDescription}`, 180);
        doc.text(splitAnomalyDesc, 18, y);
        y += (splitAnomalyDesc.length * 4);
        doc.setFontSize(10);
      }
      y += 7;
      doc.text(`Ritardo: ${currentFormData.delay?.toUpperCase() || 'N/A'}`, 14, y);
      if (currentFormData.delay === 'si' && currentFormData.delayNotes) {
        y += 5;
        doc.setFontSize(9);
        const splitDelayNotes = doc.splitTextToSize(`Motivo Ritardo: ${currentFormData.delayNotes}`, 180);
        doc.text(splitDelayNotes, 18, y);
        y += (splitDelayNotes.length * 4);
        doc.setFontSize(10);
      }
      y += 7;
      doc.text(`Esito Evento: ${currentFormData.serviceOutcome || 'N/A'}`, 14, y);
      y += 7;

      if (currentFormData.barcode) {
        const barcodeDataURL = generateBarcodeImage(currentFormData.barcode);
        if (barcodeDataURL) {
          doc.text(`Barcode: ${currentFormData.barcode}`, 14, y);
          y += 5;
          doc.addImage(barcodeDataURL, 'PNG', 14, y, 100, 20);
          y += 25;
        } else {
          doc.text(`Barcode: ${currentFormData.barcode} (Impossibile generare immagine)`, 14, y);
          y += 7;
        }
      } else {
        doc.text(`Barcode: N/A`, 14, y);
        y += 7;
      }

      const pdfBlob = doc.output('blob');
      resolve(pdfBlob);
    });
  }, [getValues, puntiServizioList, coOperatorsPersonnel, operatoriNetworkList, pattugliaPersonale, generateBarcodeImage, formatDateTimeForPdf]);

  const handlePrintPdf = useCallback(async () => {
    showInfo("Generazione PDF per la stampa...");
    const pdfBlob = await generatePdfBlob();
    if (pdfBlob) {
      const url = URL.createObjectURL(pdfBlob);
      window.open(url, '_blank');
      showSuccess("PDF generato con successo!");
    } else {
      showError("Impossibile generare il PDF.");
    }
  }, [generatePdfBlob]);

  const handleEmail = useCallback(async () => {
    const currentFormData = getValues(); // Call the function to get latest form data
    const selectedServicePoint = puntiServizioList.find(p => p.id === currentFormData.servicePoint);
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
  }, [getValues, puntiServizioList, generatePdfBlob]);

  const buildNotesString = useCallback((dataToUse: InterventionFormState) => {
    const notesCombined = [];
    if (dataToUse.fullAccess !== null && dataToUse.fullAccess !== undefined) {
      notesCombined.push(`Accesso Completo: ${dataToUse.fullAccess.toUpperCase()}`);
    }
    if (dataToUse.vaultAccess !== null && dataToUse.vaultAccess !== undefined) {
      notesCombined.push(`Accesso Caveau: ${dataToUse.vaultAccess.toUpperCase()}`);
    }
    if (dataToUse.anomalies === 'si' && dataToUse.anomalyDescription) {
      notesCombined.push(`Anomalie: ${dataToUse.anomalyDescription}`);
    }
    if (dataToUse.delay === 'si' && dataToUse.delayNotes) {
      notesCombined.push(`Ritardo: ${dataToUse.delayNotes}`);
    }
    return notesCombined.length > 0 ? notesCombined.join('; ') : null;
  }, []);

  const saveIntervention = useCallback(async (values: InterventionFormState, isFinal: boolean) => {
    clearErrors(); // Clear previous errors

    // Trigger validation for all fields
    const isValid = await triggerValidation();
    if (!isValid) {
      showError("Compila tutti i campi obbligatori e correggi gli errori.");
      return;
    }

    // If it's a final submission, trigger specific validation rules
    if (isFinal || isPublicMode) {
      const finalValidationResult = interventionFormSchema.superRefine((data, ctx) => {
        // Re-run the superRefine logic here for final submission
        if (!data.startTime) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: "L'Orario Inizio Intervento è obbligatorio per la chiusura.", path: ['startTime'] });
        }
        if (!data.endTime) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: "L'Orario Fine Intervento è obbligatorio per la chiusura.", path: ['endTime'] });
        }
        if (data.fullAccess === null || data.fullAccess === undefined) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Il campo 'Accesso Completo' è obbligatorio per la chiusura.", path: ['fullAccess'] });
        }
        if (data.vaultAccess === null || data.vaultAccess === undefined) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: "L'accesso caveau è obbligatorio per la chiusura.", path: ['vaultAccess'] });
        }
        if (!data.operatorNetworkId) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Il campo 'Operatore Network' è obbligatorio per la chiusura.", path: ['operatorNetworkId'] });
        }
        if (data.anomalies === null || data.anomalies === undefined) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Il campo 'Anomalie Riscontrate' è obbligatorio per la chiusura.", path: ['anomalies'] });
        }
        if (data.anomalies === 'si' && (!data.anomalyDescription || data.anomalyDescription.trim() === '')) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: "La 'Descrizione Anomalie' è obbligatoria se sono state riscontrate anomalie.", path: ['anomalyDescription'] });
        }
        if (data.delay === null || data.delay === undefined) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Il campo 'Ritardo' è obbligatorio per la chiusura.", path: ['delay'] });
        }
        if (data.delay === 'si' && (!data.delayNotes || data.delayNotes.trim() === '')) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Il 'Motivo del Ritardo' è obbligatorio se c'è stato un ritardo.", path: ['delayNotes'] });
        }
        if (data.startLatitude === null || data.startLatitude === undefined || data.startLongitude === null || data.startLongitude === undefined) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: "La 'Posizione GPS presa in carico Richiesta' è obbligatoria per la chiusura.", path: ['startLatitude'] });
        }
        if (data.endLatitude === null || data.endLatitude === undefined || data.endLongitude === null || data.endLongitude === undefined) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: "La 'Posizione GPS Fine Intervento' è obbligatoria per la chiusura.", path: ['endLatitude'] });
        }
      }).safeParse(values);

      if (!finalValidationResult.success) {
        finalValidationResult.error.errors.forEach(err => {
          setError(err.path[0] as keyof InterventionFormState, { type: 'manual', message: err.message });
        });
        showError("Compila tutti i campi obbligatori per la chiusura dell'evento.");
        return;
      }
    }

    let currentRequestTime = values.requestTime;
    if (!eventId) {
      currentRequestTime = format(new Date(), "yyyy-MM-dd'T'HH:mm");
    }

    const formDataToUse = { ...values, requestTime: currentRequestTime };

    const {
      servicePoint,
      requestType,
      coOperator,
      startTime,
      endTime,
      operatorNetworkId,
      gpgIntervention,
      serviceOutcome,
      barcode,
      startLatitude,
      startLongitude,
      endLatitude,
      endLongitude,
    } = formDataToUse;

    const parsedRequestDateTime = parseISO(currentRequestTime);
    const parsedStartTime = startTime ? parseISO(startTime) : null;
    const parsedEndTime = endTime ? parseISO(endTime) : null;

    const notes = buildNotesString(formDataToUse);

    const allarmeInterventoPayload = {
      report_date: format(parsedRequestDateTime, 'yyyy-MM-dd'),
      report_time: format(parsedRequestDateTime, 'HH:mm:ssXXX'),
      service_point_code: servicePoint,
      request_type: requestType,
      co_operator: coOperator || null,
      operator_client: operatorNetworkId || null,
      gpg_intervention: gpgIntervention || null,
      service_outcome: serviceOutcome || null,
      notes: notes,
      barcode: barcode || null,
      start_latitude: startLatitude || null,
      start_longitude: startLongitude || null,
      end_latitude: endLongitude || null,
    };

    let allarmeResult;
    let currentEventId = eventId;

    if (eventId) {
      allarmeResult = await supabase
        .from('allarme_interventi')
        .update(allarmeInterventoPayload)
        .eq('id', eventId);
    } else {
      allarmeResult = await supabase
        .from('allarme_interventi')
        .insert([allarmeInterventoPayload])
        .select('id');
      if (allarmeResult.data && allarmeResult.data.length > 0) {
        currentEventId = allarmeResult.data[0].id;
      }
    }

    if (allarmeResult.error) {
      showError(`Errore durante la ${eventId ? 'modifica' : 'registrazione'} dell'evento di allarme: ${allarmeResult.error.message}`);
      console.error(`Error ${eventId ? 'updating' : 'inserting'} alarm event:`, allarmeResult.error);
      return;
    }

    if (!currentEventId) {
      showError("Impossibile ottenere l'ID dell'evento per la registrazione del servizio.");
      return;
    }

    const selectedServicePoint = puntiServizioList.find(p => p.id === servicePoint);
    const clientId = selectedServicePoint?.id_cliente || null;
    const fornitoreId = selectedServicePoint?.fornitore_id || null;

    if (!clientId) {
      showError("Impossibile determinare il cliente associato al punto servizio per l'analisi contabile.");
      return;
    }

    const costDetails = {
      type: "Intervento",
      client_id: clientId,
      service_point_id: servicePoint,
      fornitore_id: fornitoreId,
      start_date: parsedStartTime || parsedRequestDateTime,
      end_date: parsedEndTime || parsedStartTime || parsedRequestDateTime,
      start_time: parsedStartTime ? format(parsedStartTime, 'HH:mm:ss') : null,
      end_time: parsedEndTime ? format(parsedEndTime, 'HH:mm:ss') : null,
      num_agents: 1,
      cadence_hours: null,
      inspection_type: null,
      daily_hours_config: null,
    };

    const calculatedCostResult = await calculateServiceCost(costDetails);
    const calculatedCost = calculatedCostResult ? (calculatedCostResult.multiplier * calculatedCostResult.clientRate) : null;

    let serviceStatus: "Pending" | "Approved" | "Rejected" | "Completed" = "Pending";
    if (isFinal || isPublicMode) {
      switch (serviceOutcome) {
        case "Intervento Concluso":
        case "Falso Allarme":
        case "Anomalia Riscontrata":
          serviceStatus = "Completed";
          break;
        case "Intervento Annullato":
          serviceStatus = "Rejected";
          break;
        default:
          serviceStatus = "Pending";
          break;
      }
    } else {
      serviceStatus = "Pending";
    }

    const serviziRichiestiPayload = {
      id: currentEventId,
      type: "Intervento",
      client_id: clientId,
      service_point_id: servicePoint,
      fornitore_id: fornitoreId,
      start_date: parsedStartTime ? format(parsedStartTime, 'yyyy-MM-dd') : format(parsedRequestDateTime, 'yyyy-MM-dd'),
      start_time: parsedStartTime ? format(parsedStartTime, 'HH:mm:ssXXX') : null,
      end_date: parsedEndTime ? format(parsedEndTime, 'yyyy-MM-dd') : null,
      end_time: parsedEndTime ? format(parsedEndTime, 'HH:mm:ssXXX') : null,
      status: serviceStatus,
      calculated_cost: calculatedCost,
      num_agents: 1,
      cadence_hours: null,
      inspection_type: null,
      daily_hours_config: null,
    };

    const { error: serviziError } = await supabase
      .from('servizi_richiesti')
      .upsert([serviziRichiestiPayload], { onConflict: 'id' });

    if (serviziError) {
      showError(`Errore durante la ${eventId ? 'modifica' : 'registrazione'} del servizio per analisi contabile: ${serviziError.message}`);
      console.error(`Error ${eventId ? 'updating' : 'inserting'} servizi_richiesti:`, serviziError);
      return;
    }

    showSuccess(`Evento ${eventId ? 'modificato' : 'registrato'} e servizio per analisi contabile aggiornato con successo!`);
    resetForm();
    if (onSaveSuccess) {
      onSaveSuccess();
    }
  }, [eventId, isPublicMode, onSaveSuccess, puntiServizioList, buildNotesString, resetForm, triggerValidation, setError, clearErrors, getValues]);

  const handleCloseEvent = useCallback((values: InterventionFormState) => {
    saveIntervention(values, true);
  }, [saveIntervention]);

  const handleRegisterEvent = useCallback((values: InterventionFormState) => {
    saveIntervention(values, false);
  }, [saveIntervention]);

  return {
    handlePrintPdf,
    handleEmail,
    handleCloseEvent,
    handleRegisterEvent,
  };
};