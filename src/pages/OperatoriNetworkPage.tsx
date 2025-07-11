import React, { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OperatoriNetworkForm } from "@/components/anagrafiche/OperatoriNetworkForm";
import { OperatoriNetworkTable } from "@/components/anagrafiche/OperatoriNetworkTable";
import { useSearchParams } from "react-router-dom";
import { Download, Upload } from "lucide-react";
import { showSuccess, showError, showInfo } from "@/utils/toast";
import { exportTableToExcel, exportTemplateToExcel } from "@/utils/export"; // Import exportTemplateToExcel
import { importDataFromExcel } from "@/utils/import";
import { supabase } from "@/integrations/supabase/client";
import { ImportSummaryDialog } from "@/components/anagrafiche/ImportSummaryDialog"; // Import the new dialog

const OperatoriNetworkPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") || "lista-operatori-network"; // Changed default tab
  const [isSummaryDialogOpen, setIsSummaryDialogOpen] = useState(false);
  const [importSummary, setImportSummary] = useState<any>(null);

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  useEffect(() => {
    if (!searchParams.get("tab")) {
      setSearchParams({ tab: "lista-operatori-network" }); // Changed default tab
    }
  }, [searchParams, setSearchParams]);

  const handleExport = async () => {
    const tableName = "operatori_network";
    // Updated columns to select for export
    const columnsToSelect = ["id", "created_at", "nome", "cognome", "client_id", "telefono", "email"];

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
      exportTableToExcel(fetchedData, `Anagrafiche_OperatoriNetwork`, `OperatoriNetwork`);
    } else {
      showInfo("Nessun dato da esportare per gli Operatori Network.");
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      showInfo(`Inizio importazione del file "${file.name}" per gli Operatori Network...`);
      const result = await importDataFromExcel(file, "operatori-network");

      setImportSummary(result); // Pass the whole result object
      setIsSummaryDialogOpen(true); // Always open dialog to show summary

      // showSuccess and showError are now handled by the dialog based on the summary content.
      event.target.value = '';
    }
  };

  const handleDownloadTemplate = () => {
    const headers = ["nome", "cognome", "clienteId", "telefono", "email"];
    exportTemplateToExcel(headers, "Template_OperatoriNetwork", "OperatoriNetwork");
  };

  return (
    <div className="container mx-auto p-4">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">Gestione Operatori Network</CardTitle>
          <CardDescription className="text-center">Aggiungi nuovi operatori network o visualizza e gestisci quelli esistenti.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-end space-x-2 mb-4">
            <Button onClick={handleDownloadTemplate} variant="outline">
              <Download className="mr-2 h-4 w-4" /> Scarica Template
            </Button>
            <Button onClick={handleExport} variant="outline">
              <Download className="mr-2 h-4 w-4" /> Esporta Excel
            </Button>
            <Label htmlFor="import-operatori-network-excel" className="flex items-center cursor-pointer">
              <Input id="import-operatori-network-excel" type="file" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" onChange={handleImport} className="hidden" />
              <Button asChild variant="outline">
                <span><Upload className="mr-2 h-4 w-4" /> Importa Excel</span>
              </Button>
            </Label>
          </div>

          <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2">
              <TabsTrigger value="nuovo-operatore-network">Nuovo Operatore Network</TabsTrigger>
              <TabsTrigger value="lista-operatori-network">Lista Operatori Network</TabsTrigger>
            </TabsList>
            <TabsContent value="nuovo-operatore-network" className="mt-4">
              <OperatoriNetworkForm />
            </TabsContent>
            <TabsContent value="lista-operatori-network" className="mt-4">
              <OperatoriNetworkTable />
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

export default OperatoriNetworkPage;