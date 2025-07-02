import { useState, useEffect } from 'react';
import { Cliente, Fornitore, PuntoServizio, Personale, OperatoreNetwork, Procedure } from "@/lib/anagrafiche-data";
import { fetchClienti, fetchFornitori, fetchPuntiServizio, fetchPersonale, fetchOperatoriNetwork, fetchProcedure } from "@/lib/data-fetching";

interface AnagraficheData {
  clienti: Cliente[];
  fornitori: Fornitore[];
  puntiServizio: PuntoServizio[];
  personale: Personale[];
  operatoriNetwork: OperatoreNetwork[];
  procedure: Procedure[];
  loading: boolean;
}

// Cache in-memory per i dati
let cachedData: AnagraficheData | null = null;

export function useAnagraficheData(): AnagraficheData {
  const [data, setData] = useState<AnagraficheData>(
    cachedData || {
      clienti: [],
      fornitori: [],
      puntiServizio: [],
      personale: [],
      operatoriNetwork: [],
      procedure: [],
      loading: true,
    }
  );

  useEffect(() => {
    if (cachedData) {
      return;
    }

    const loadAllData = async () => {
      const [
        clientiData,
        fornitoriData,
        puntiServizioData,
        personaleData,
        operatoriNetworkData,
        procedureData,
      ] = await Promise.all([
        fetchClienti(),
        fetchFornitori(),
        fetchPuntiServizio(),
        fetchPersonale(),
        fetchOperatoriNetwork(),
        fetchProcedure(),
      ]);

      const newCache: AnagraficheData = {
        clienti: clientiData,
        fornitori: fornitoriData,
        puntiServizio: puntiServizioData,
        personale: personaleData,
        operatoriNetwork: operatoriNetworkData,
        procedure: procedureData,
        loading: false,
      };
      
      cachedData = newCache;
      setData(newCache);
    };

    loadAllData();
  }, []);

  return data;
}