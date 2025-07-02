import React, { useState, useEffect, useCallback } from 'react';
import { format, parseISO, isValid } from 'date-fns';
import { showSuccess, showError, showInfo } from "@/utils/toast";
import { supabase } from '@/integrations/supabase/client';
import { fetchPersonale, fetchOperatoriNetwork, fetchPuntiServizio } from '@/lib/data-fetching';
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

interface UseInterventionFormResult {
  formData: InterventionFormData;
  setFormData: React.Dispatch<React.SetStateAction<InterventionFormData>>;
  operatoriNetworkList: OperatoreNetwork[];
  pattugliaPersonale: Personale[];
  puntiServizioList: PuntoServizio[];
  coOperatorsPersonnel: Personale[];
  isOperatorNetworkOpen: boolean;
  setIsOperatorNetworkOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isGpgInterventionOpen: boolean;
  setIsGpgInterventionOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isServicePointOpen: boolean;
  setIsServicePointOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isCoOperatorOpen: boolean;
  setIsCoOperatorOpen: React.Dispatch<React.SetStateAction<boolean>>;
  loadingInitialData: boolean;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSelectChange: (name: string, value: string) => void;
  handleRadioChange: (name: string, value: 'si' | 'no') => void;
  handleSetCurrentTime: (field: string) => void;
  handleStartGpsTracking: () => void;
  handleEndGpsTracking: () => void;
}

export function useInterventionForm(eventId?: string): UseInterventionFormResult {
  const [formData, setFormData] = useState<InterventionFormData>({
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

        // We only need the times from servizi_richiesti, if they exist.
        // The rest of the data for the form comes from allarme_interventi.
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
          // Helper to safely format DB time (HH:mm:ss or HH:mm:ss+TZ) to form time (HH:mm)
          const formatDbTimeToForm = (dbTime: string | null | undefined): string => {
            if (!dbTime) return '00:00'; // Default to a valid time if input is null/undefined/empty
            // Ensure it's at least 5 characters long before substring
            if (dbTime.length < 5) return '00:00'; 
            return dbTime.substring(0, 5);
          };

          // Helper to safely construct a datetime-local string (YYYY-MM-DDTHH:mm)
          const createDateTimeString = (date: string | null | undefined, time: string | null | undefined): string => {
            if (!date) return ''; // Date is mandatory for a full datetime string
            const formattedTime = formatDbTimeToForm(time);
            return `${date}T${formattedTime}`;
          };

          const requestTimeString = createDateTimeString(event.report_date, event.report_time);
          const startTimeString = createDateTimeString(serviceTimes?.start_date, serviceTimes?.start_time);
          const endTimeString = createDateTimeString(serviceTimes?.end_date, serviceTimes?.end_time);

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
            startTime: startTimeString || requestTimeString, // Fallback to requestTime if startTime is not set
            endTime: endTimeString || startTimeString || requestTimeString, // Fallback to startTime, then requestTime
            fullAccess: undefined, // These fields are not stored in DB, so they remain undefined or need to be inferred from notes
            vaultAccess: undefined, // Same as above
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
  };
}