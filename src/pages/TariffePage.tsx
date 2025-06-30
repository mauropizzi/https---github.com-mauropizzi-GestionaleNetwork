import React, { useEffect } from "react";
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

const TariffePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") || "nuova-tariffa";

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  useEffect(() => {
    if (!searchParams.get("tab")) {
      setSearchParams({ tab: "nuova-tariffa" });
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

      if (result.success) {
        showSuccess(result.message);
      } else {
        showError(result.message);
        if (result.details) {
          if (result.details.invalidRecords.length > 0) {
            console.error("Record non validi ignorati:", result.details.invalidRecords);
          }
          if (result.details.errors && result.details.errors.length > 0) {
            console.error("Errori di importazione:", result.details.errors);
          }
        }
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
    </div>
  );
};

export default TariffePage;