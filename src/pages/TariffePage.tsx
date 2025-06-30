import React, { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TariffeForm } from "@/components/anagrafiche/TariffeForm";
import { TariffeTable } from "@/components/anagrafiche/TariffeTable";
import { useSearchParams } from "react-router-dom";
import { Download, Upload } from "lucide-react";
import { showSuccess, showError, showInfo } from "@/utils/toast";
import { exportTableToExcel, exportTemplateToExcel } from "@/utils/export"; // Import exportTemplateToExcel
import { importDataFromExcel } from "@/utils/import";
import { supabase } from "@/integrations/supabase/client";
import { ImportSummaryDialog } from "@/components/anagrafiche/ImportSummaryDialog"; // Import the new dialog

const TariffePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") || "lista-tariffe"; // Changed default tab
  const [isSummaryDialogOpen, setIsSummaryDialogOpen] = useState(false);
  const [importSummary, setImportSummary] = useState<any>(null);

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  useEffect(() => {
    if (!searchParams.get("tab")) {
      setSearchParams({ tab: "lista-tariffe" }); // Changed default tab
    }
  }, [searchParams, setSearchParams]);

  const handleExport = async () => {
    const tableName = "tariffe";
    const columnsToSelect = ["id", "created_at", "client_id", "service_type", "client_rate", "supplier_rate", "unita_misura", "punto_servizio_id", "fornitore_id", "data_inizio_validita", "data_fine_validita", "note"];

    const { data, error } = await supabase
      .from(tableName)
      .select(columnsToSelect.join(','));

    if (error) {
      showError(`Errore nel recupero dei dati per l'esportazione: ${error.message}`);
      console.error("Error fetching data for export:", error);
      return;
    }

    const fetchedData = data || []; // Ensure data is an array

    if (fetchedData.length > 0) {
      exportTableToExcel(fetchedData, `Anagrafiche_Tariffe`, `Tariffe`);
    } else {
      showInfo("Nessun dato da esportare per le Tariffe.");
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      showInfo(`Inizio importazione del file "${file.name}" per le Tariffe...`);
      const result = await importDataFromExcel(file, "tariffe");

      setImportSummary(result.details);
      setIsSummaryDialogOpen(true); // Always open dialog to show summary

      if (result.success) {
        // showSuccess(result.message); // Handled by dialog
      } else {
        // showError(result.message); // Handled by dialog
      }
      event.target.value = '';
    }
  };

  const handleDownloadTemplate = () => {
    const headers = ["client_id", "tipo_servizio", "importo", "supplier_rate", "unita_misura", "punto_servizio_id", "fornitore_id", "data_inizio_validita", "data_fine_validita", "note"];
    exportTemplateToExcel(headers, "Template_Tariffe", "Tariffe");
  };

  return (
    <div className="container mx-auto p-4">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">Gestione Tariffe</CardTitle>
          <CardDescription className="text-center">Aggiungi nuove tariffe o visualizza e gestisci quelle esistenti.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-end space-x-2 mb-4">
            <Button onClick={handleDownloadTemplate} variant="outline">
              <Download className="mr-2 h-4 w-4" /> Scarica Template
            </Button>
            <Button onClick={handleExport} variant="outline">
              <Download className="mr-2 h-4 w-4" /> Esporta Excel
            </Button>
            <Label htmlFor="import-tariffe-excel" className="flex items-center cursor-pointer">
              <Input id="import-tariffe-excel" type="file" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" onChange={handleImport} className="hidden" />
              <Button asChild variant="outline">
                <span><Upload className="mr-2 h-4 w-4" /> Importa Excel</span>
              </Button>
            </Label>
          </div>

          <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2">
              <TabsTrigger value="nuova-tariffa">Nuova Tariffa</TabsTrigger>
              <TabsTrigger value="lista-tariffe">Lista Tariffe</TabsTrigger>
            </TabsList>
            <TabsContent value="nuova-tariffa" className="mt-4">
              <TariffeForm />
            </TabsContent>
            <TabsContent value="lista-tariffe" className="mt-4">
              <TariffeTable />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      <ImportSummaryDialog
        isOpen={isSummaryDialogOpen}
        onClose={() => setIsSummaryDialogOpen(false)}
        summary={importSummary}
      />
    </div>
  );
};

export default TariffePage;