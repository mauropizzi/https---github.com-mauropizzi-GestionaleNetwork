import { useState, useCallback, useEffect } from 'react';
import { format } from 'date-fns';
import { showSuccess, showError, showInfo } from "@/utils/toast";

interface InterventionFormState {
  servicePoint: string;
  requestType: string;
  coOperator: string;
  requestTime: string;
  startTime: string;
  endTime: string;
  fullAccess: 'si' | 'no' | undefined;
  vaultAccess: 'si' | 'no' | undefined;
  operatorNetworkId: string;
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

interface UseInterventionFormStateResult {
  formData: InterventionFormState;
  setFormData: React.Dispatch<React.SetStateAction<InterventionFormState>>;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSelectChange: (name: string, value: string) => void;
  handleRadioChange: (name: string, value: 'si' | 'no') => void;
  handleSetCurrentTime: (field: string) => void;
  handleStartGpsTracking: () => void;
  handleEndGpsTracking: () => void;
  resetForm: () => void;
}

export const useInterventionFormState = (initialData?: any): UseInterventionFormStateResult => {
  const defaultFormData: InterventionFormState = {
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
  };

  const [formData, setFormData] = useState<InterventionFormState>(initialData || defaultFormData);

  // Update form data when initialData is loaded/changes
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData(defaultFormData);
    }
  }, [initialData]);

  const resetForm = useCallback(() => {
    setFormData(defaultFormData);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleSelectChange = useCallback((name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleRadioChange = useCallback((name: string, value: 'si' | 'no') => {
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleSetCurrentTime = useCallback((field: string) => {
    const now = new Date();
    const formattedDateTime = format(now, "yyyy-MM-dd'T'HH:mm");
    setFormData(prev => ({ ...prev, [field]: formattedDateTime }));
  }, []);

  const handleStartGpsTracking = useCallback(() => {
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
  }, []);

  const handleEndGpsTracking = useCallback(() => {
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
  }, []);

  return {
    formData,
    setFormData,
    handleInputChange,
    handleSelectChange,
    handleRadioChange,
    handleSetCurrentTime,
    handleStartGpsTracking,
    handleEndGpsTracking,
    resetForm,
  };
};