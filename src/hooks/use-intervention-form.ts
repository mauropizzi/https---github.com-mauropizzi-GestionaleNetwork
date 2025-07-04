import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useInterventionDataFetching } from './use-intervention-data-fetching';
import { useInterventionActions } from './use-intervention-actions';
import { format } from 'date-fns';
import { showSuccess, showError, showInfo } from "@/utils/toast"; // Import toast utilities

// Define the Zod schema for the form
const interventionFormSchema = z.object({
  servicePoint: z.string().uuid("Seleziona un punto servizio valido.").nonempty("Il punto servizio è richiesto."),
  requestType: z.string().min(1, "La tipologia di servizio è richiesta."),
  coOperator: z.string().uuid("Seleziona un operatore C.O. valido.").nonempty("L'operatore C.O. è richiesto."),
  requestTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato ora non valido (HH:MM)."), // This will be set automatically
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
}).superRefine((data, ctx) => {
  // Conditional validation for final submission
  const isFinalSubmission = data.serviceOutcome !== null && data.serviceOutcome !== undefined && data.serviceOutcome !== '';

  if (isFinalSubmission) {
    if (!data.startTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "L'Orario Inizio Intervento è obbligatorio per la chiusura.",
        path: ['startTime'],
      });
    }
    if (!data.endTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "L'Orario Fine Intervento è obbligatorio per la chiusura.",
        path: ['endTime'],
      });
    }
    if (data.fullAccess === null || data.fullAccess === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Il campo 'Accesso Completo' è obbligatorio per la chiusura.",
        path: ['fullAccess'],
      });
    }
    if (data.vaultAccess === null || data.vaultAccess === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "L'accesso caveau è obbligatorio per la chiusura.",
        path: ['vaultAccess'],
      });
    }
    if (!data.operatorNetworkId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Il campo 'Operatore Network' è obbligatorio per la chiusura.",
        path: ['operatorNetworkId'],
      });
    }
    if (data.anomalies === null || data.anomalies === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Il campo 'Anomalie Riscontrate' è obbligatorio per la chiusura.",
        path: ['anomalies'],
      });
    }
    if (data.anomalies === 'si' && (!data.anomalyDescription || data.anomalyDescription.trim() === '')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La 'Descrizione Anomalie' è obbligatoria se sono state riscontrate anomalie.",
        path: ['anomalyDescription'],
      });
    }
    if (data.delay === null || data.delay === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Il campo 'Ritardo' è obbligatorio per la chiusura.",
        path: ['delay'],
      });
    }
    if (data.delay === 'si' && (!data.delayNotes || data.delayNotes.trim() === '')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Il 'Motivo del Ritardo' è obbligatorio se c'è stato un ritardo.",
        path: ['delayNotes'],
      });
    }
    if (data.startLatitude === null || data.startLatitude === undefined || data.startLongitude === null || data.startLongitude === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La 'Posizione GPS presa in carico Richiesta' è obbligatoria per la chiusura.",
        path: ['startLatitude'], // Can point to either lat or lon
      });
    }
    if (data.endLatitude === null || data.endLatitude === undefined || data.endLongitude === null || data.endLongitude === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La 'Posizione GPS Fine Intervento' è obbligatoria per la chiusura.",
        path: ['endLatitude'], // Can point to either lat or lon
      });
    }
  }
});


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

  const methods = useForm<z.infer<typeof interventionFormSchema>>({
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
    getValues, // Pass current form values
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