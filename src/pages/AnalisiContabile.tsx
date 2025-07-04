import React, { useState, useEffect } from "react"; // Import React and useEffect
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAnalisiContabileData } from "@/hooks/use-analisi-contabile-data";
import { AnalysisFilters } from "@/components/analisi-contabile/AnalysisFilters";
import { ServiceSummaryTable } from "@/components/analisi-contabile/ServiceSummaryTable";
import { MissingTariffsTable } from "@/components/analisi-contabile/MissingTariffsTable";
import { supabase } from "@/integrations/supabase/client"; // Import supabase client

const AnalisiContabile = () => {
  console.log("AnalisiContabile: Component rendering.");
  const [currentTab, setCurrentTab] = useState("sintesi-contabile");
  
  // Temporary test for direct query to servizi_canone
  useEffect(() => {
    const testServiziCanoneFetch = async () => {
      console.log("AnalisiContabile: Running temporary direct fetch for 'servizi_canone'...");
      const { data, error } = await supabase
        .from('servizi_canone')
        .select('*'); // Select all to see if any data is returned

      if (error) {
        console.error("AnalisiContabile: Direct fetch error for 'servizi_canone':", error);
      } else {
        console.log("AnalisiContabile: Direct fetch data for 'servizi_canone':", data);
      }
    };
    testServiziCanoneFetch();
  }, []); // Run once on component mount

  const hookResult = useAnalisiContabileData();
  console.log("AnalisiContabile: Result of useAnalisiContabileData:", hookResult);

  // Controllo per prevenire il crash se l'hook restituisce undefined
  if (!hookResult) {
    console.error("AnalisiContabile: useAnalisiContabileData ha restituito undefined!");
    return (
      <div className="container mx-auto p-4 text-center">
        <Card className="w-full max-w-6xl mx-auto">
          <CardHeader><CardTitle className="text-3xl font-bold text-center">Errore di Caricamento Dati</CardTitle></CardHeader>
          <CardContent><p className="text-xl text-gray-600 dark:text-gray-400">Impossibile caricare i dati di analisi. Riprova o contatta il supporto.</p></CardContent>
        </Card>
      </div>
    );
  }

  const {
    clientsList,
    selectedClientId,
    setSelectedClientId,
    summaryData,
    missingTariffs,
    loadingSummary,
    loadingMissingTariffs,
    startDateFilter,
    setStartDateFilter,
    endDateFilter,
    setEndDateFilter,
    fetchAndProcessServiceData,
    fetchAndIdentifyMissingTariffs,
    handleResetFilters,
  } = hookResult; // Destruttura da hookResult

  return (
    <div className="container mx-auto p-4">
      <Card className="w-full max-w-6xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">Analisi Contabile</CardTitle>
          <CardDescription className="text-center">
            Strumenti per l'analisi dei costi e la verifica delle tariffe.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="sintesi-contabile">Sintesi Contabile</TabsTrigger>
              <TabsTrigger value="tariffe-mancanti">Verifica Tariffe Mancanti</TabsTrigger>
            </TabsList>

            <TabsContent value="sintesi-contabile" className="mt-4">
              <AnalysisFilters
                clientsList={clientsList}
                selectedClientId={selectedClientId}
                setSelectedClientId={setSelectedClientId}
                startDateFilter={startDateFilter}
                setStartDateFilter={setStartDateFilter}
                endDateFilter={endDateFilter}
                setEndDateFilter={endDateFilter}
                handleResetFilters={handleResetFilters}
                onRefresh={fetchAndProcessServiceData}
                loading={loadingSummary}
                showClientFilter={true}
              />
              <ServiceSummaryTable data={summaryData} loading={loadingSummary} />
            </TabsContent>

            <TabsContent value="tariffe-mancanti" className="mt-4">
              <AnalysisFilters
                clientsList={clientsList}
                selectedClientId={selectedClientId}
                setSelectedClientId={setSelectedClientId}
                startDateFilter={startDateFilter}
                setStartDateFilter={setStartDateFilter}
                endDateFilter={endDateFilter}
                setEndDateFilter={endDateFilter}
                handleResetFilters={handleResetFilters}
                onRefresh={fetchAndIdentifyMissingTariffs}
                loading={loadingMissingTariffs}
                showClientFilter={false}
              />
              <MissingTariffsTable data={missingTariffs} loading={loadingMissingTariffs} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalisiContabile;