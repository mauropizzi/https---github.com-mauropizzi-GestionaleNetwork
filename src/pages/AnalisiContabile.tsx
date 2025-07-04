"use client";

import React, { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Import Tabs components
import { useSearchParams } from "react-router-dom"; // Import useSearchParams
import { useAnalisiContabileData } from "@/hooks/use-analisi-contabile-data";
import { AnalysisFilters } from "@/components/analisi-contabile/AnalysisFilters";
import { ServiceSummaryTable } from "@/components/analisi-contabile/ServiceSummaryTable";
import { MissingTariffsTable } from "@/components/analisi-contabile/MissingTariffsTable";

export default function AnalisiContabile() {
  const [searchParams, setSearchParams] = useSearchParams(); // Initialize useSearchParams
  const currentTab = searchParams.get("tab") || "riepilogo-costi"; // Default tab

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  // Ensure a default tab is set if none is present in the URL
  useEffect(() => {
    if (!searchParams.get("tab")) {
      setSearchParams({ tab: "riepilogo-costi" });
    }
  }, [searchParams, setSearchParams]);

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

  // Fetch data when filters or selected client change
  useEffect(() => {
    fetchAndProcessServiceData();
    fetchAndIdentifyMissingTariffs();
  }, [selectedClientId, startDateFilter, endDateFilter, fetchAndProcessServiceData, fetchAndIdentifyMissingTariffs]);

  const handleRefresh = () => {
    fetchAndProcessServiceData();
    fetchAndIdentifyMissingTariffs();
  };

  return (
    <div className="container mx-auto p-4">
      <Card className="w-full max-w-6xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">Analisi Contabile Servizi</CardTitle>
          <CardDescription className="text-center">
            Visualizza il riepilogo dei costi dei servizi e identifica le tariffe mancanti.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AnalysisFilters
            clientsList={clientsList}
            selectedClientId={selectedClientId}
            setSelectedClientId={setSelectedClientId}
            startDateFilter={startDateFilter}
            setStartDateFilter={setStartDateFilter}
            endDateFilter={endDateFilter}
            setEndDateFilter={setEndDateFilter}
            handleResetFilters={handleResetFilters}
            onRefresh={handleRefresh}
            loading={loadingSummary || loadingMissingTariffs}
          />

          <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="riepilogo-costi">Riepilogo Costi</TabsTrigger>
              <TabsTrigger value="tariffe-mancanti">Tariffe Mancanti</TabsTrigger>
            </TabsList>
            <TabsContent value="riepilogo-costi" className="mt-4">
              <h2 className="text-2xl font-semibold mb-4">Riepilogo Costi Servizi</h2>
              <ServiceSummaryTable data={summaryData} loading={loadingSummary} />
            </TabsContent>
            <TabsContent value="tariffe-mancanti" className="mt-4">
              <h2 className="text-2xl font-semibold mb-4">Tariffe Mancanti</h2>
              <MissingTariffsTable data={missingTariffs} loading={loadingMissingTariffs} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}