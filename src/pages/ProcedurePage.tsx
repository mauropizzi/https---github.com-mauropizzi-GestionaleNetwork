import React, { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProcedureForm } from "@/components/anagrafiche/ProcedureForm";
import { ProcedureTable } from "@/components/anagrafiche/ProcedureTable";
import { useSearchParams } from "react-router-dom";
import { Download, Upload } from "lucide-react";
import { showSuccess, showError, showInfo } from "@/utils/toast";
import { exportTableToExcel, exportTemplateToExcel } from "@/utils/export";
import { importDataFromExcel } from "@/utils/import";
import { supabase } from "@/integrations/supabase/client";
import { ImportSummaryDialog } from "@/components/anagrafiche/ImportSummaryDialog";

const ProcedurePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") || "lista-procedure";
  const [isSummaryDialogOpen, setIsSummaryDialogOpen] = useState(false);
  const [importSummary, setImportSummary] = useState<any>(null);

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  useEffect(() => {
    if (!searchParams.get("tab")) {
      setSearchParams({ tab: "lista-procedure" });
    }
  }, [searchParams, setSearchParams]);

  const handleExport = async () => {
    const tableName = "procedure";
    const columnsToSelect = ["id", "created_at", "nome_procedura", "descrizione", "versione", "data_ultima_revisione", "responsabile", "documento_url", "attivo", "note"];

    const { data, error } = await supabase
      .from(tableName)
      .select(columnsToSelect.join(','));

    if (error) {
      showError(`Errore nel recupero dei dati per l'esportazione: ${error.message}`);
      console.error("Error fetching data for export:", error);
      return;
    }

    const fetchedData = data || [];

    if (fetchedData.length > 0) {
      exportTableToExcel(fetchedData, `Anagrafiche_Procedure`, `Procedure`);
    } else {
      showInfo("Nessun dato da esportare per le Procedure.");
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      showInfo(`Inizio importazione del file "${file.name}" per le Procedure...`);
      const result = await importDataFromExcel(file, "procedure");

      setImportSummary(result.details);
      setIsSummaryDialogOpen(true);

      if (result.success) {
        // showSuccess(result.message); // Handled by dialog
      } else {
        // showError(result.message); // Handled by dialog
      }
      event.target.value = '';
    }
  };

  const handleDownloadTemplate = () => {
    const headers = ["nome_procedura", "descrizione", "versione", "data_ultima_revisione", "responsabile", "documento_url", "attivo", "note"];
    exportTemplateToExcel(headers, "Template_Procedure", "Procedure");
  };

  return (
    <div className="container mx-auto p-4">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">Gestione Procedure</CardTitle>
          <CardDescription className="text-center">Aggiungi nuove procedure o visualizza e gestisci quelle esistenti.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-end space-x-2 mb-4">
            <Button onClick={handleDownloadTemplate} variant="outline">
              <Download className="mr-2 h-4 w-4" /> Scarica Template
            </Button>
            <Button onClick={handleExport} variant="outline">
              <Download className="mr-2 h-4 w-4" /> Esporta Excel
            </Button>
            <Label htmlFor="import-procedure-excel" className="flex items-center cursor-pointer">
              <Input id="import-procedure-excel" type="file" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" onChange={handleImport} className="hidden" />
              <Button asChild variant="outline">
                <span><Upload className="mr-2 h-4 w-4" /> Importa Excel</span>
              </Button>
            </Label>
          </div>

          <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2">
              <TabsTrigger value="nuova-procedura">Nuova Procedura</TabsTrigger>
              <TabsTrigger value="lista-procedure">Lista Procedure</TabsTrigger>
            </TabsList>
            <TabsContent value="nuova-procedura" className="mt-4">
              <ProcedureForm />
            </TabsContent>
            <TabsContent value="lista-procedure" className="mt-4">
              <ProcedureTable />
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

export default ProcedurePage;