import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { fetchPersonale, fetchOperatoriNetwork, fetchPuntiServizio } from '@/lib/data-fetching';
import { Personale, OperatoreNetwork, PuntoServizio } from '@/lib/anagrafiche-data';
import { showError } from "@/utils/toast";
import { parseISO, isValid } from 'date-fns';

interface InterventionDataFetchingResult {
  operatoriNetworkList: OperatoreNetwork[];
  pattugliaPersonale: Personale[];
  puntiServizioList: PuntoServizio[];
  coOperatorsPersonnel: Personale[];
  loadingInitialData: boolean;
  initialFormData: any; // To return the fetched event data for initial form state
}

export const useInterventionDataFetching = (eventId?: string, isPublicMode: boolean = false): InterventionDataFetchingResult => {
  const [operatoriNetworkList, setOperatoriNetworkList] = useState<OperatoreNetwork[]>([]);
  const [pattugliaPersonale, setPattugliaPersonale] = useState<Personale[]>([]);
  const [puntiServizioList, setPuntiServizioList] = useState<PuntoServizio[]>([]);
  const [coOperatorsPersonnel, setCoOperatorsPersonnel] = useState<Personale[]>([]);
  const [loadingInitialData, setLoadingInitialData] = useState(true);
  const [initialFormData, setInitialFormData] = useState<any>(null);

  useEffect(() => {
    const loadAllData = async () => {
      setLoadingInitialData(true);
      try {
        if (isPublicMode) {
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
          const [
            fetchedOperatoriNetwork,
            fetchedPattuglia,
            fetchedPuntiServizio,
            fetchedCoOperators
          ] = await Promise.all([
            fetchOperatoriNetwork(),
            fetchPersonale('Pattuglia'),
            fetchPuntiServizio(),
            fetchPersonale('Operatore C.O.')
          ]);
          setOperatoriNetworkList(fetchedOperatoriNetwork);
          setPattugliaPersonale(fetchedPattuglia);
          setPuntiServizioList(fetchedPuntiServizio);
          setCoOperatorsPersonnel(fetchedCoOperators);
        }

        if (eventId) {
          const { data: event, error: eventError } = await supabase
            .from('allarme_interventi')
            .select('*, start_latitude, start_longitude, end_latitude, end_longitude, barcode')
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
            return;
          }

          if (event) {
            let anomalyDescription = '';
            let delayNotes = '';
            let anomalies: 'si' | 'no' | undefined = undefined;
            let delay: 'si' | 'no' | undefined = undefined;
            let fullAccess: 'si' | 'no' | undefined = undefined;
            let vaultAccess: 'si' | 'no' | undefined = undefined;

            if (event.notes) {
              const notesArray = event.notes.split('; ').map((s: string) => s.trim());
              const anomalyMatch = notesArray.find((note: string) => note.startsWith('Anomalie:'));
              if (anomalyMatch) {
                anomalies = 'si';
                anomalyDescription = anomalyMatch.replace('Anomalie:', '').trim();
              } else {
                anomalies = 'no';
              }
              const delayMatch = notesArray.find((note: string) => note.startsWith('Ritardo:'));
              if (delayMatch) {
                delay = 'si';
                delayNotes = delayMatch.replace('Ritardo:', '').trim();
              } else {
                delay = 'no';
              }
              const fullAccessMatch = notesArray.find((note: string) => note.startsWith('Accesso Completo:'));
              if (fullAccessMatch) {
                fullAccess = fullAccessMatch.replace('Accesso Completo:', '').trim().toLowerCase() as 'si' | 'no';
              }
              const vaultAccessMatch = notesArray.find((note: string) => note.startsWith('Accesso Caveau:'));
              if (vaultAccessMatch) {
                vaultAccess = vaultAccessMatch.replace('Accesso Caveau:', '').trim().toLowerCase() as 'si' | 'no';
              }
            }

            const requestTimeString = (event.report_date && event.report_time) 
              ? `${event.report_date}T${event.report_time.substring(0, 5)}` 
              : ''; 
            const startTimeString = (serviceTimes?.start_date && serviceTimes?.start_time)
              ? `${serviceTimes.start_date}T${serviceTimes.start_time.substring(0, 5)}`
              : ''; 
            const endTimeString = (serviceTimes?.end_date && serviceTimes?.end_time)
              ? `${serviceTimes.end_date}T${serviceTimes.end_time.substring(0, 5)}`
              : ''; 

            setInitialFormData({
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
              barcode: event.barcode || '',
              startLatitude: event.start_latitude || undefined,
              startLongitude: event.start_longitude || undefined,
              endLatitude: event.end_latitude || undefined,
              endLongitude: event.end_longitude || undefined,
            });
          }
        }
      } catch (error) {
        console.error("Error loading all data:", error);
        showError("Errore nel caricamento dei dati.");
      } finally {
        setLoadingInitialData(false);
      }
    };
    loadAllData();
  }, [eventId, isPublicMode]);

  return {
    operatoriNetworkList,
    pattugliaPersonale,
    puntiServizioList,
    coOperatorsPersonnel,
    loadingInitialData,
    initialFormData,
  };
};