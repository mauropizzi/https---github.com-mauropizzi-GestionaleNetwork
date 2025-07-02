import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { format, parseISO, isValid } from 'date-fns';
import { showSuccess, showError, showInfo } from "@/utils/toast";
import { sendEmail } from "@/utils/email";
import JsBarcode from 'jsbarcode';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { supabase } from '@/integrations/supabase/client';
import { fetchPersonale, fetchOperatoriNetwork, fetchPuntiServizio, calculateServiceCost } from '@/lib/data-fetching';
import { Personale, OperatoreNetwork, PuntoServizio } from '@/lib/anagrafiche-data';

// Import new modular components
import { EventDetailsSection } from './EventDetailsSection';
import { InterventionTimesSection } from './InterventionTimesSection';
import { AccessDetailsSection } from './AccessDetailsSection';
import { PersonnelSection } from './PersonnelSection';
import { AnomaliesDelaySection } from './AnomaliesDelaySection';
import { OutcomeBarcodeSection } from './OutcomeBarcodeSection';
import { InterventionActionButtons } from './InterventionActionButtons';

interface InterventionFormProps {
  eventId?: string; // Optional ID for editing
  onSaveSuccess?: () => void; // Callback for successful save/update
  onCancel?: () => void; // Callback for cancel
  isPublicMode?: boolean;
}

export function InterventionForm({ eventId, onSaveSuccess, onCancel, isPublicMode = false }: InterventionFormProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    servicePoint: '',
    requestType: '',
    coOperator: '',
    requestTime: '',
    startTime: '',
    endTime: '',
    fullAccess: undefined as 'si' | 'no' | undefined, // Initialized to undefined
    vaultAccess: undefined as 'si' | 'no' | undefined, // Initialized to undefined
    operatorNetworkId: '',
    gpgIntervention: '',
    anomalies: undefined as 'si' | 'no' | undefined,
    anomalyDescription: '',
    delay: undefined as 'si' | 'no' | undefined,
    delayNotes: '',
    serviceOutcome: '',
    barcode: '',
    startLatitude: undefined as number | undefined,
    startLongitude: undefined as number | undefined,
    endLatitude: undefined as number | undefined,
    endLongitude: undefined as number | undefined,
  });
  const [operatoriNetworkList, setOperatoriNetworkList] = useState<OperatoreNetwork[]>([]);
  const [pattugliaPersonale, setPattugliaPersonale] = useState<Personale[]>([]);
  const [puntiServizioList, setPuntiServizioList] = useState<PuntoServizio[]>([]);
  const [coOperatorsPersonnel, setCoOperatorsPersonnel] = useState<Personale[]>([]);
  const [isOperatorNetworkOpen, setIsOperatorNetworkOpen] = useState(false);
  const [isGpgInterventionOpen, setIsGpgInterventionOpen] = useState(false);
  const [isServicePointOpen, setIsServicePointOpen] = useState(false);
  const [isCoOperatorOpen, setIsCoOperatorOpen] = useState(false);
  const [loadingInitialData, setLoadingInitialData] = useState(!!eventId);

  useEffect(() => {
    const loadDropdownData = async () => {
      if (isPublicMode) {
        // Fetch all data from the new edge function
        console.log("Public mode: Fetching form data from edge function...");
        const { data, error } = await supabase.functions.invoke('get-intervention-form-data');
        if (error) {
          showError(`Errore nel caricamento dei dati per il modulo: ${error.message}`);
          console.error("Error invoking get-intervention-form-data:", error);
          return;
        }
        setOperatoriNetworkList(data.operatoriNetworkList || []);
        setPattugliaPersonale(data.pattugliaPersonale || []);
        setPuntiServizioList(data.puntiServizioList || []);
        setCoOperatorsPersonnel(data.coOperatorsPersonnel || []);
      } else {
        // Fetch data using existing client-side functions for authenticated users
        console.log("Internal mode: Fetching form data from client...");
        const fetchedOperatoriNetwork = await fetchOperatoriNetwork();
        setOperatoriNetworkList(fetchedOperatoriNetwork);

        const fetchedPattuglia = await fetchPersonale('Pattuglia');
        setPattugliaPersonale(fetchedPattuglia);

        const fetchedPuntiServizio = await fetchPuntiServizio();
        setPuntiServizioList(fetchedPuntiServizio);

        const fetchedCoOperators = await fetchPersonale('Operatore C.O.');
        setCoOperatorsPersonnel(fetchedCoOperators);
      }
    };
    loadDropdownData();
  }, [isPublicMode]);

  useEffect(() => {
    const loadEventDataForEdit = async () => {
      if (eventId) {
        setLoadingInitialData(true);
        
        const { data: event, error: eventError } = await supabase
          .from('allarme_interventi')
          .select('*')
          .eq('id', eventId)
          .single();

        const { data: serviceTimes, error: serviceTimesError } = await supabase
          .from('servizi_richiesti')
          .select('start_date, start_time, end_date, end_time')
          .eq('id', eventId)
          .single();

        if (eventError) {
          showError(`Errore nel recupero dei dati dell'evento: ${eventError.message}`);
          console.error("Error fetching event data for edit:", eventError);
          setLoadingInitialData(false);
          return;
        }

        if (event) {
          let anomalyDescription = '';
          let delayNotes = '';
          let anomalies: 'si' | 'no' | undefined = undefined; // Initialize as undefined
          let delay: 'si' | 'no' | undefined = undefined;     // Initialize as undefined
          let fullAccess: 'si' | 'no' | undefined = undefined; // Initialize as undefined
          let vaultAccess: 'si' | 'no' | undefined = undefined; // Initialize as undefined

          if (event.notes) {
            const notesArray = event.notes.split('; ').map((s: string) => s.trim());

            const anomalyMatch = notesArray.find((note: string) => note.startsWith('Anomalie:'));
            if (anomalyMatch) {
              anomalies = 'si';
              anomalyDescription = anomalyMatch.replace('Anomalie:', '').trim();
            } else {
              anomalies = 'no'; // Explicitly set to 'no' if not found
            }

            const delayMatch = notesArray.find((note: string) => note.startsWith('Ritardo:'));
            if (delayMatch) {
              delay = 'si';
              delayNotes = delayMatch.replace('Ritardo:', '').trim();
            } else {
              delay = 'no'; // Explicitly set to 'no' if not found
            }

            const fullAccessMatch = notesArray.find((note: string) => note.startsWith('Accesso Completo:'));
            if (fullAccessMatch) {
              fullAccess = fullAccessMatch.replace('Accesso Completo:', '').trim().toLowerCase() as 'si' | 'no';
            }
            // If not found, it remains undefined.

            const vaultAccessMatch = notesArray.find((note: string) => note.startsWith('Accesso Caveau:'));
            if (vaultAccessMatch) {
              vaultAccess = vaultAccessMatch.replace('Accesso Caveau:', '').trim().toLowerCase() as 'si' | 'no';
            }
            // If not found, it remains undefined.
          }
          // If event.notes is null, all these variables remain undefined, which is the desired "empty" state.

          console.log("Raw event.report_date:", event.report_date);
          console.log("Raw event.report_time:", event.report_time);
          const requestTimeString = (event.report_date && event.report_time) 
            ? `${event.report_date}T${event.report_time.substring(0, 5)}` 
            : ''; // Ensure it's an empty string if parts are missing
          console.log("Constructed requestTimeString:", requestTimeString);


          console.log("Raw serviceTimes?.start_date:", serviceTimes?.start_date);
          console.log("Raw serviceTimes?.start_time:", serviceTimes?.start_time);
          const startTimeString = (serviceTimes?.start_date && serviceTimes?.start_time)
            ? `${serviceTimes.start_date}T${serviceTimes.start_time.substring(0, 5)}`
            : ''; // Ensure empty string
          console.log("Constructed startTimeString:", startTimeString);

          console.log("Raw serviceTimes?.end_date:", serviceTimes?.end_date);
          console.log("Raw serviceTimes?.end_time:", serviceTimes?.end_time);
          const endTimeString = (serviceTimes?.end_date && serviceTimes?.end_time)
            ? `${serviceTimes.end_date}T${serviceTimes.end_time.substring(0, 5)}`
            : ''; // Ensure empty string
          console.log("Constructed endTimeString:", endTimeString);

          setFormData({
            servicePoint: event.service_point_code || '',
            requestType: event.request_type || '',
            coOperator: event.co_operator || '',
            requestTime: requestTimeString,
            startTime: startTimeString,
            endTime: endTimeString,
            fullAccess: fullAccess,
            vaultAccess: vaultAccess,
            operatorNetworkId: event.operator_client || '',
            gpgIntervention: event.gpg_intervention || '',
            anomalies: anomalies,
            anomalyDescription: anomalyDescription,
            delay: delay,
            delayNotes: delayNotes,
            serviceOutcome: event.service_outcome || '',
            barcode: '',
            startLatitude: event.start_latitude || undefined,
            startLongitude: event.start_longitude || undefined,
            endLatitude: event.end_latitude || undefined,
            endLongitude: event.end_longitude || undefined,
          });
        }
        setLoadingInitialData(false);
      }
    };
    loadEventDataForEdit();
  }, [eventId]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRadioChange = (name: string, value: 'si' | 'no') => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSetCurrentTime = (field: string) => {
    const now = new Date();
    const formattedDateTime = format(now, "yyyy-MM-dd'T'HH:mm");
    setFormData(prev => ({ ...prev, [field]: formattedDateTime }));
  };

  const handleStartGpsTracking = () => {
    if (navigator.geolocation) {
      showInfo("Acquisizione posizione GPS inizio intervento...");
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setFormData(prev => ({ ...prev, startLatitude: latitude, startLongitude: longitude }));
          showSuccess(`Posizione GPS inizio intervento acquisita: Lat ${latitude.toFixed(6)}, Lon ${longitude.toFixed(6)}`);
        },
        (error) => {
          showError(`Errore acquisizione GPS inizio intervento: ${error.message}`);
          console.error("Error getting start GPS position:", error);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      showError("La geolocalizzazione non è supportata dal tuo browser.");
    }
  };

  const handleEndGpsTracking = () => {
    if (navigator.geolocation) {
      showInfo("Acquisizione posizione GPS fine intervento...");
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setFormData(prev => ({ ...prev, endLatitude: latitude, endLongitude: longitude }));
          showSuccess(`Posizione GPS fine intervento acquisita: Lat ${latitude.toFixed(6)}, Lon ${longitude.toFixed(6)}`);
        },
        (error) => {
          showError(`Errore acquisizione GPS fine intervento: ${error.message}`);
          console.error("Error getting end GPS position:", error);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      showError("La geolocalizzazione non è supportata dal tuo browser.");
    }
  };

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
      const selectedOperatorNetworkForPdf = operatoriNetworkList.find(op => op.id === formData.operatorNetworkId);
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

  const saveIntervention = async (isFinal: boolean) => {
    const {
      servicePoint,
      requestType,
      coOperator,
      requestTime,
      startTime,
      endTime,
      fullAccess,
      vaultAccess,
      operatorNetworkId,
      gpgIntervention,
      anomalies,
      anomalyDescription,
      delay,
      delayNotes,
      serviceOutcome,
      barcode,
      startLatitude,
      startLongitude,
      endLatitude,
      endLongitude,
    } = formData;

    if (!servicePoint || !requestType || !requestTime) {
      showError("Punto Servizio, Tipologia Servizio Richiesto e Orario Richiesta sono obbligatori.");
      return;
    }

    // Validate and parse requestTime
    const parsedRequestDateTime = parseISO(requestTime);
    if (!isValid(parsedRequestDateTime)) {
      showError("Formato Orario Richiesta non valido. Assicurarsi di aver inserito una data e un'ora complete.");
      return;
    }

    // Validate and parse startTime and endTime
    const parsedStartTime = startTime ? parseISO(startTime) : null;
    if (startTime && !isValid(parsedStartTime)) {
      showError("Formato Orario Inizio Intervento non valido. Assicurarsi di aver inserito una data e un'ora complete.");
      return;
    }

    const parsedEndTime = endTime ? parseISO(endTime) : null;
    if (endTime && !isValid(parsedEndTime)) {
      showError("Formato Orario Fine Intervento non valido. Assicurarsi di aver inserito una data e un'ora complete.");
      return;
    }

    // Additional validation for final submission
    if (isFinal) {
      if (!parsedStartTime) {
        showError("Orario Inizio Intervento è obbligatorio per la chiusura.");
        return;
      }
      if (!parsedEndTime) {
        showError("Orario Fine Intervento è obbligatorio per la chiusura.");
        return;
      }
      if (fullAccess === undefined || vaultAccess === undefined || anomalies === undefined || delay === undefined) {
        showError("Tutti i campi 'SI/NO' sono obbligatori per la chiusura.");
        return;
      }
      if (!serviceOutcome) {
        showError("L'Esito Evento è obbligatorio per la chiusura.");
        return;
      }
    }

    const notesCombined = [];
    // Only include fullAccess and vaultAccess in notes if they have been explicitly selected
    if (fullAccess !== undefined) {
      notesCombined.push(`Accesso Completo: ${fullAccess.toUpperCase()}`);
    }
    if (vaultAccess !== undefined) {
      notesCombined.push(`Accesso Caveau: ${vaultAccess.toUpperCase()}`);
    }
    
    if (anomalies === 'si' && anomalyDescription) {
      notesCombined.push(`Anomalie: ${anomalyDescription}`);
    }
    if (delay === 'si' && delayNotes) {
      notesCombined.push(`Ritardo: ${delayNotes}`);
    }

    const reportDateForDb = format(parsedRequestDateTime, 'yyyy-MM-dd');
    const reportTimeForDb = format(parsedRequestDateTime, 'HH:mm:ss');

    const allarmeInterventoPayload = {
      report_date: reportDateForDb,
      report_time: reportTimeForDb,
      service_point_code: servicePoint,
      request_type: requestType,
      co_operator: coOperator || null,
      operator_client: operatorNetworkId || null,
      gpg_intervention: gpgIntervention || null,
      service_outcome: isFinal ? (serviceOutcome || null) : null,
      notes: notesCombined.length > 0 ? notesCombined.join('; ') : null,
      start_latitude: startLatitude || null,
      start_longitude: startLongitude || null,
      end_latitude: endLatitude || null,
      end_longitude: endLongitude || null,
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
    if (isFinal) {
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
    }

    const serviziRichiestiPayload = {
      id: currentEventId,
      type: "Intervento",
      client_id: clientId,
      service_point_id: servicePoint,
      fornitore_id: fornitoreId,
      start_date: parsedStartTime ? format(parsedStartTime, 'yyyy-MM-dd') : reportDateForDb,
      start_time: parsedStartTime ? format(parsedStartTime, 'HH:mm:ss') : null,
      end_date: parsedEndTime ? format(parsedEndTime, 'yyyy-MM-dd') : null,
      end_time: parsedEndTime ? format(parsedEndTime, 'HH:mm:ss') : null,
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
    setFormData({
      servicePoint: '',
      requestType: '',
      coOperator: '',
      requestTime: '',
      startTime: '',
      endTime: '',
      fullAccess: undefined,
      vaultAccess: undefined,
      operatorNetworkId: '',
      gpgIntervention: '',
      anomalies: undefined,
      anomalyDescription: '',
      delay: undefined,
      delayNotes: '',
      serviceOutcome: '',
      barcode: '',
      startLatitude: undefined,
      startLongitude: undefined,
      endLatitude: undefined,
      endLongitude: undefined,
    });
    onSaveSuccess?.();
  };

  const handleCloseEvent = (e: React.FormEvent) => {
    e.preventDefault();
    saveIntervention(true);
  };

  const handleRegisterEvent = (e: React.FormEvent) => {
    e.preventDefault();
    saveIntervention(false);
  };

  if (loadingInitialData) {
    return (
      <div className="text-center py-8">
        Caricamento dati evento...
      </div>
    );
  }

  return (
    <React.Fragment>
      <form onSubmit={handleCloseEvent} className="space-y-6">
        <EventDetailsSection
          formData={formData}
          handleInputChange={handleInputChange}
          handleSelectChange={handleSelectChange}
          handleSetCurrentTime={handleSetCurrentTime}
          handleStartGpsTracking={handleStartGpsTracking}
          puntiServizioList={puntiServizioList}
          coOperatorsPersonnel={coOperatorsPersonnel}
          isServicePointOpen={isServicePointOpen}
          setIsServicePointOpen={setIsServicePointOpen}
          isCoOperatorOpen={isCoOperatorOpen}
          setIsCoOperatorOpen={setIsCoOperatorOpen}
        />

        <InterventionTimesSection
          formData={formData}
          handleInputChange={handleInputChange}
          handleSetCurrentTime={handleSetCurrentTime}
          handleEndGpsTracking={handleEndGpsTracking}
        />

        <AccessDetailsSection
          formData={formData}
          handleRadioChange={handleRadioChange}
        />

        <PersonnelSection
          formData={formData}
          handleSelectChange={handleSelectChange}
          operatoriNetworkList={operatoriNetworkList}
          pattugliaPersonale={pattugliaPersonale}
          isOperatorNetworkOpen={isOperatorNetworkOpen}
          setIsOperatorNetworkOpen={setIsOperatorNetworkOpen}
          isGpgInterventionOpen={isGpgInterventionOpen}
          setIsGpgInterventionOpen={setIsGpgInterventionOpen}
        />

        <AnomaliesDelaySection
          formData={formData}
          handleRadioChange={handleRadioChange}
          handleInputChange={handleInputChange}
        />

        <OutcomeBarcodeSection
          formData={formData}
          handleSelectChange={handleSelectChange}
          handleInputChange={handleInputChange}
        />

        <InterventionActionButtons
          eventId={eventId}
          handleEmail={handleEmail}
          handlePrintPdf={handlePrintPdf}
          handleRegisterEvent={handleRegisterEvent}
          handleCloseEvent={handleCloseEvent}
          onCancel={onCancel}
          isPublicMode={isPublicMode}
        />
      </form>
    </React.Fragment>
  );
}