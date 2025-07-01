import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { format, parseISO, isValid } from 'date-fns';
import { showSuccess, showError, showInfo } from "@/utils/toast";
import { supabase } from '@/integrations/supabase/client';
import { fetchPersonale, fetchOperatoriNetwork, fetchPuntiServizio, calculateServiceCost } from '@/lib/data-fetching';
import { Personale, OperatoreNetwork, PuntoServizio } from '@/lib/anagrafiche-data';
import { useInterventionReportActions } from '@/hooks/use-intervention-report-actions'; // Import the new hook

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
}

export function InterventionForm({ eventId, onSaveSuccess, onCancel }: InterventionFormProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    servicePoint: '',
    requestType: '',
    coOperator: '',
    requestTime: '',
    startTime: '',
    endTime: '',
    fullAccess: undefined as 'si' | 'no' | undefined,
    vaultAccess: undefined as 'si' | 'no' | undefined,
    operatorClient: '',
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

  // Use the new hook for report actions
  const { handlePrintPdf, handleEmail } = useInterventionReportActions({
    formData,
    puntiServizioList,
    coOperatorsPersonnel,
    operatoriNetworkList,
    pattugliaPersonale,
  });

  useEffect(() => {
    const loadDropdownData = async () => {
      const fetchedOperatoriNetwork = await fetchOperatoriNetwork();
      setOperatoriNetworkList(fetchedOperatoriNetwork);

      const fetchedPattuglia = await fetchPersonale('Pattuglia');
      setPattugliaPersonale(fetchedPattuglia);

      const fetchedPuntiServizio = await fetchPuntiServizio();
      setPuntiServizioList(fetchedPuntiServizio);

      const fetchedCoOperators = await fetchPersonale('Operatore C.O.');
      setCoOperatorsPersonnel(fetchedCoOperators);
    };
    loadDropdownData();
  }, []);

  useEffect(() => {
    const loadEventDataForEdit = async () => {
      if (eventId) {
        setLoadingInitialData(true);
        
        const { data: event, error: eventError } = await supabase
          .from('allarme_interventi')
          .select('*')
          .eq('id', eventId)
          .single();

        const { data: service, error: serviceError } = await supabase
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
          const formatDbTime = (dbTime: string | null | undefined) => {
            if (!dbTime) return '';
            try {
              const parsed = parseISO(`2000-01-01T${dbTime}`);
              return isValid(parsed) ? format(parsed, 'HH:mm') : '';
            } catch (e) {
              return '';
            }
          };

          const requestTimeString = event.report_date && event.report_time ? `${event.report_date}T${formatDbTime(event.report_time)}` : '';
          const startTimeString = service?.start_date && service?.start_time ? `${service.start_date}T${formatDbTime(service.start_time)}` : '';
          const endTimeString = service?.end_date && service?.end_time 
            ? `${service.end_date}T${formatDbTime(service.end_time)}` 
            : (startTimeString || requestTimeString);

          let anomalyDescription = '';
          let delayNotes = '';
          let anomalies: 'si' | 'no' | undefined = undefined;
          let delay: 'si' | 'no' | undefined = undefined;

          if (event.notes) {
            const notesArray = event.notes.split('; ').map((s: string) => s.trim());
            const anomalyMatch = notesArray.find((note: string) => note.startsWith('Anomalie:'));
            const delayMatch = notesArray.find((note: string) => note.startsWith('Ritardo:'));

            if (anomalyMatch) {
              anomalies = 'si';
              anomalyDescription = anomalyMatch.replace('Anomalie:', '').trim();
            } else {
              anomalies = 'no';
            }
            if (delayMatch) {
              delay = 'si';
              delayNotes = delayMatch.replace('Ritardo:', '').trim();
            } else {
              delay = 'no';
            }
          } else {
            anomalies = 'no';
            delay = 'no';
          }

          setFormData({
            servicePoint: event.service_point_code || '',
            requestType: event.request_type || '',
            coOperator: event.co_operator || '',
            requestTime: requestTimeString,
            startTime: startTimeString || requestTimeString,
            endTime: endTimeString,
            fullAccess: undefined,
            vaultAccess: undefined,
            operatorClient: event.operator_client || '',
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
      operatorClient,
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

    // 1. Validate and parse requestTime
    let parsedRequestDateTime: Date;
    if (requestTime && isValid(parseISO(requestTime))) {
      parsedRequestDateTime = parseISO(requestTime);
    } else {
      showError("Orario Richiesta è obbligatorio e deve essere un valore valido.");
      return;
    }

    // 2. Validate and parse startTime and endTime
    let parsedStartTime: Date | null = startTime ? parseISO(startTime) : null;
    if (startTime && !isValid(parsedStartTime)) {
      showError("Formato Orario Inizio Intervento non valido.");
      return;
    }

    let parsedEndTime: Date | null = endTime ? parseISO(endTime) : null;
    if (endTime && !isValid(parsedEndTime)) {
      showError("Formato Orario Fine Intervento non valido.");
      return;
    }

    // 3. Additional validation for final submission
    if (isFinal) {
      if (!parsedStartTime || !parsedEndTime) {
        showError("Orario Inizio e Fine Intervento sono obbligatori per la chiusura.");
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
    if (anomalies === 'si' && anomalyDescription) {
      notesCombined.push(`Anomalie: ${anomalyDescription}`);
    }
    if (delay === 'si' && delayNotes) {
      notesCombined.push(`Ritardo: ${delayNotes}`);
    }

    // --- Time processing for DB ---
    const reportDateForDb = format(parsedRequestDateTime, 'yyyy-MM-dd');
    const reportTimeForDb = format(parsedRequestDateTime, 'HH:mm:ss');

    // Determine final dates and times for the payload
    // Use request time as a fallback for start time.
    // Use start time (or its fallback) as a fallback for end time.
    const finalStartDate = parsedStartTime || parsedRequestDateTime;
    const finalEndDate = parsedEndTime || finalStartDate;

    const finalStartDateForDb = format(finalStartDate, 'yyyy-MM-dd');
    const finalStartTimeForDb = format(finalStartDate, 'HH:mm:ss');

    const finalEndDateForDb = format(finalEndDate, 'yyyy-MM-dd');
    const finalEndTimeForDb = format(finalEndDate, 'HH:mm:ss');

    // --- Save to allarme_interventi ---
    const allarmeInterventoPayload = {
      report_date: reportDateForDb,
      report_time: reportTimeForDb,
      service_point_code: servicePoint,
      request_type: requestType,
      co_operator: coOperator || null,
      operator_client: operatorClient || null,
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
        .select('id'); // Select the ID of the newly inserted row
      if (allarmeResult.data && allarmeResult.data.length > 0) {
        currentEventId = allarmeResult.data[0].id;
      }
    }

    if (allarmeResult.error) {
      showError(`Errore durante la ${eventId ? 'modifica' : 'registrazione'} dell'evento di allarme: ${allarmeResult.error.message}`);
      console.error(`Error ${eventId ? 'updating' : 'inserting'} alarm event:`, allarmeResult.error);
      return;
    }

    // --- Also save/update in servizi_richiesti for accounting analysis ---
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
      type: "Intervento", // Fixed type for this service
      client_id: clientId,
      service_point_id: servicePoint,
      fornitore_id: fornitoreId,
      start_date: finalStartDate,
      end_date: finalEndDate,
      start_time: finalStartTimeForDb,
      end_time: finalEndTimeForDb,
      num_agents: 1, // Assuming 1 agent for an intervention
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
        case "Intervento in Corso": // Should not be final, but for completeness
        default:
          serviceStatus = "Pending";
          break;
      }
    }

    const serviziRichiestiPayload = {
      id: currentEventId, // Use the same ID to link records
      type: "Intervento",
      client_id: clientId,
      service_point_id: servicePoint,
      fornitore_id: fornitoreId,
      start_date: finalStartDateForDb,
      start_time: finalStartTimeForDb,
      end_date: finalEndDateForDb,
      end_time: finalEndTimeForDb,
      status: serviceStatus,
      calculated_cost: calculatedCost,
      num_agents: 1, // Assuming 1 agent for an intervention
      cadence_hours: null,
      inspection_type: null,
      daily_hours_config: null,
    };

    const { error: serviziError } = await supabase
      .from('servizi_richiesti')
      .upsert([serviziRichiestiPayload], { onConflict: 'id' }); // Use upsert to create or update

    if (serviziError) {
      showError(`Errore durante la ${eventId ? 'modifica' : 'registrazione'} del servizio per analisi contabile: ${serviziError.message}`);
      console.error(`Error ${eventId ? 'updating' : 'inserting'} servizi_richiesti:`, serviziError);
      // Decide if you want to roll back allarme_interventi or just log this as a partial success/failure
      return;
    }

    showSuccess(`Evento ${eventId ? 'modificato' : 'registrato'} e servizio per analisi contabile aggiornato con successo!`);
    setFormData({ // Reset form
      servicePoint: '',
      requestType: '',
      coOperator: '',
      requestTime: '',
      startTime: '',
      endTime: '',
      fullAccess: undefined,
      vaultAccess: undefined,
      operatorClient: '',
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
    onSaveSuccess?.(); // Call success callback
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
    return <div className="text-center py-8">Caricamento dati evento...</div>;
  }

  return (
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
      />
    </form>
  );
}