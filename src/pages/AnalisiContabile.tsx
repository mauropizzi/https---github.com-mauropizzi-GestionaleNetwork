"use client";

import React, { useState, useEffect, useCallback } from "react"; // Added useCallback
import { format, startOfMonth, endOfMonth } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";
import { it } from 'date-fns/locale'; // Import Italian locale

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AnalysisFilters } from "@/components/analisi-contabile/AnalysisFilters";
import { ServiceSummaryTable } from "@/components/analisi-contabile/ServiceSummaryTable";
import { MissingTariffsTable } from "@/components/analisi-contabile/MissingTariffsTable";
import { useAnalisiContabileData } from "@/hooks/use-analisi-contabile-data";

export default function AnalisiContabile() {
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

  const handleRefreshAll = useCallback(() => {
    fetchAndProcessServiceData();
    fetchAndIdentifyMissingTariffs();
  }, [fetchAndProcessServiceData, fetchAndIdentifyMissingTariffs]);

  useEffect(() => {
    handleRefreshAll(); // Initial fetch when component mounts
  }, [handleRefreshAll]);

  return (
    <div className="container mx-auto p-4">
      <Card className="w-full max-w-6xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">Analisi Contabile Servizi</CardTitle>
          <CardDescription className="text-center">Visualizza il riepilogo dei costi dei servizi e identifica le tariffe mancanti.</CardDescription>
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
            onRefresh={handleRefreshAll}
            loading={loadingSummary || loadingMissingTariffs}
          />

          <h3 className="text-xl font-semibold mt-8 mb-4">Riepilogo Costi Servizi</h3>
          <ServiceSummaryTable data={summaryData} loading={loadingSummary} />

          <h3 className="text-xl font-semibold mt-8 mb-4">Tariffe Mancanti</h3>
          <MissingTariffsTable data={missingTariffs} loading={loadingMissingTariffs} />
        </CardContent>
      </Card>
    </div>
  );
}