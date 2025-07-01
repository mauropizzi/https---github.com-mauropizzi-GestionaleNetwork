import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAnalisiContabileData } from "@/hooks/use-analisi-contabile-data";
import { AnalysisFilters } from "@/components/analisi-contabile/AnalysisFilters";
import { ServiceSummaryTable } from "@/components/analisi-contabile/ServiceSummaryTable";
import { MissingTariffsTable } from "@/components/analisi-contabile/MissingTariffsTable";

const AnalisiContabile = () => {
  const [currentTab, setCurrentTab] = useState("sintesi-contabile");
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
  } = useAnalisiContabileData();

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
                setEndDateFilter={setEndDateFilter}
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
                setEndDateFilter={setEndDateFilter}
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