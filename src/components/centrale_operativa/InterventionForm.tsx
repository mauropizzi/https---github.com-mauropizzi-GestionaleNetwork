import React from 'react';
import { useToast } from '@/components/ui/use-toast';
import { format, parseISO, isValid } from 'date-fns';
import { showSuccess, showError, showInfo } from "@/utils/toast";
import { supabase } from '@/integrations/supabase/client';
import { calculateServiceCost } from '@/lib/data-fetching';
import { useInterventionForm } from '@/hooks/use-intervention-form'; // Import the new hook
import { useInterventionReportActions } from '@/hooks/use-intervention-report-actions';

// Import modular components
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
  const {
    formData,
    setFormData,
    operatoriNetworkList,
    pattugliaPersonale,
    puntiServizioList,
    coOperatorsPersonnel,
    isOperatorNetworkOpen,
    setIsOperatorNetworkOpen,
    isGpgInterventionOpen,
    setIsGpgInterventionOpen,
    isServicePointOpen,
    setIsServicePointOpen,
    isCoOperatorOpen,
    setIsCoOperatorOpen,
    loadingInitialData,
    handleInputChange,
    handleSelectChange,
    handleRadioChange,
    handleSetCurrentTime,
    handleStartGpsTracking,
    handleEndGpsTracking,
  } = useInterventionForm(eventId);

  // Use the new hook for report actions
  const { handlePrintPdf, handleEmail } = useInterventionReportActions({
    formData,
    puntiServizioList,
    coOperatorsPersonnel,
    operatoriNetworkList,
    pattugliaPersonale,
  });

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
    if (!requestTime) {
      showError("Orario Richiesta è obbligatorio.");
      return;
    }
    const parsedRequestDateTime = parseISO(requestTime);
    if (!isValid(parsedRequestDateTime)) {
      showError("Formato Orario Richiesta non valido. Assicurarsi di aver inserito una data e un'ora complete.");
      return;
    }

    // 2. Validate and parse startTime and endTime
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

    // 3. Additional validation for final submission
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
    if (anomalies === 'si' && anomalyDescription) {
      notesCombined.push(`Anomalie: ${anomalyDescription}`);
    }
    if (delay === 'si' && delayNotes) {
      notesCombined.push(`Ritardo: ${delayNotes}`);
    }

    // --- Time processing for DB ---
    const reportDateForDb = format(parsedRequestDateTime, 'yyyy-MM-dd');
    const reportTimeForDb = format(parsedRequestDateTime, 'HH:mm:ssXXX'); // Correct format for 'time with time zone'

    // Determine final dates and times for the payload
    // Use request time as a fallback for start time.
    // Use start time (or its fallback) as a fallback for end time.
    const finalStartDate = parsedStartTime || parsedRequestDateTime;
    const finalEndDate = parsedEndTime || finalStartDate;

    const finalStartDateForDb = format(finalStartDate, 'yyyy-MM-dd');
    const finalStartTimeForDb = format(finalStartDate, 'HH:mm:ssXXX'); // Correct format for 'time with time zone'
    
    const finalEndDateForDb = format(finalEndDate, 'yyyy-MM-dd');
    const finalEndTimeForDb = format(finalEndDate, 'HH:mm:ssXXX'); // Correct format for 'time with time zone'

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