import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useInterventionDataFetching } from './use-intervention-data-fetching';
import { useInterventionActions } from './use-intervention-actions';
import { format } from 'date-fns';
import { z } from 'zod';
import { showSuccess, showError, showInfo } from "@/utils/toast";
import { interventionFormSchema } from '@/lib/schemas/intervention-schema'; // Import the shared schema

type InterventionFormState = z.infer<typeof interventionFormSchema>; // Define type from imported schema

interface UseInterventionFormProps {
  eventId?: string;
  onSaveSuccess?: () => void;
  isPublicMode?: boolean;
}

export const useInterventionForm = ({ eventId, onSaveSuccess, isPublicMode = false }: UseInterventionFormProps) => {
  const {
    operatoriNetworkList,
    pattugliaPersonale,
    puntiServizioList,
    coOperatorsPersonnel,
    loadingInitialData,
    initialFormData,
  } = useInterventionDataFetching(eventId, isPublicMode);

  const methods = useForm<InterventionFormState>({ // Use InterventionFormState
    resolver: zodResolver(interventionFormSchema),
    defaultValues: {
      servicePoint: '',
      requestType: '',
      coOperator: '',
      requestTime: format(new Date(), "yyyy-MM-dd'T'HH:mm"), // Set current time as default
      startTime: null,
      endTime: null,
      fullAccess: null,
      vaultAccess: null,
      operatorNetworkId: null,
      gpgIntervention: '',
      anomalies: null,
      anomalyDescription: null,
      delay: null,
      delayNotes: null,
      serviceOutcome: null,
      barcode: '',
      startLatitude: null,
      startLongitude: null,
      endLatitude: null,
      endLongitude: null,
    },
    mode: 'onChange', // Validate on change
  });

  const { reset, setValue, getValues, trigger, control, watch, setError, clearErrors } = methods;

  // Update form data when initialData is loaded/changes
  useEffect(() => {
    if (initialFormData) {
      // Map initialFormData to form schema, handling potential nulls/undefineds
      reset({
        servicePoint: initialFormData.servicePoint || '',
        requestType: initialFormData.requestType || '',
        coOperator: initialFormData.coOperator || '',
        requestTime: initialFormData.requestTime || format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        startTime: initialFormData.startTime || null,
        endTime: initialFormData.endTime || null,
        fullAccess: initialFormData.fullAccess || null,
        vaultAccess: initialFormData.vaultAccess || null,
        operatorNetworkId: initialFormData.operatorNetworkId || null,
        gpgIntervention: initialFormData.gpgIntervention || '',
        anomalies: initialFormData.anomalies || null,
        anomalyDescription: initialFormData.anomalyDescription || null,
        delay: initialFormData.delay || null,
        delayNotes: initialFormData.delayNotes || null,
        serviceOutcome: initialFormData.serviceOutcome || null,
        barcode: initialFormData.barcode || '',
        startLatitude: initialFormData.startLatitude || null,
        startLongitude: initialFormData.startLongitude || null,
        endLatitude: initialFormData.endLatitude || null,
        endLongitude: initialFormData.endLongitude || null,
      });
    } else {
      // Reset to default values if no initial data (for new forms)
      reset({
        servicePoint: '',
        requestType: '',
        coOperator: '',
        requestTime: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        startTime: null,
        endTime: null,
        fullAccess: null,
        vaultAccess: null,
        operatorNetworkId: null,
        gpgIntervention: '',
        anomalies: null,
        anomalyDescription: null,
        delay: null,
        delayNotes: null,
        serviceOutcome: null,
        barcode: '',
        startLatitude: null,
        startLongitude: null,
        endLatitude: null,
        endLongitude: null,
      });
    }
  }, [initialFormData, reset]);

  const handleSetCurrentTime = useCallback((field: 'startTime' | 'endTime') => {
    const now = new Date();
    const formattedDateTime = format(now, "yyyy-MM-dd'T'HH:mm");
    setValue(field, formattedDateTime);
  }, [setValue]);

  const handleStartGpsTracking = useCallback(() => {
    if (navigator.geolocation) {
      showInfo("Acquisizione posizione GPS inizio intervento...");
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setValue('startLatitude', latitude);
          setValue('startLongitude', longitude);
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
  }, [setValue]);

  const handleEndGpsTracking = useCallback(() => {
    if (navigator.geolocation) {
      showInfo("Acquisizione posizione GPS fine intervento...");
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setValue('endLatitude', latitude);
          setValue('endLongitude', longitude);
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
  }, [setValue]);

  const {
    handlePrintPdf,
    handleEmail,
    handleCloseEvent,
    handleRegisterEvent,
  } = useInterventionActions({
    formData: getValues(), // Pass current form values
    puntiServizioList,
    coOperatorsPersonnel,
    operatoriNetworkList,
    pattugliaPersonale,
    eventId,
    isPublicMode,
    onSaveSuccess,
    resetForm: () => reset(), // Pass reset function
    triggerValidation: trigger, // Pass trigger function
    setError, // Pass setError
    clearErrors, // Pass clearErrors
  });

  // State for Popover open/close (these are UI-specific, can remain here or be moved to component)
  const [isOperatorNetworkOpen, setIsOperatorNetworkOpen] = useState(false);
  const [isGpgInterventionOpen, setIsGpgInterventionOpen] = useState(false);
  const [isServicePointOpen, setIsServicePointOpen] = useState(false);
  const [isCoOperatorOpen, setIsCoOperatorOpen] = useState(false);

  return {
    methods, // Return all methods from useForm
    operatoriNetworkList,
    pattugliaPersonale,
    puntiServizioList,
    coOperatorsPersonnel,
    loadingInitialData,
    isOperatorNetworkOpen,
    setIsOperatorNetworkOpen,
    isGpgInterventionOpen,
    setIsGpgInterventionOpen,
    isServicePointOpen,
    setIsServicePointOpen,
    isCoOperatorOpen,
    setIsCoOperatorOpen,
    handleSetCurrentTime,
    handleStartGpsTracking,
    handleEndGpsTracking,
    handlePrintPdf,
    handleEmail,
    handleCloseEvent,
    handleRegisterEvent,
  };
};