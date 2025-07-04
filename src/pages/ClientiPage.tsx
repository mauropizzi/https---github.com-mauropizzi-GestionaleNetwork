import React, { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ClientiForm } from "@/components/anagrafiche/ClientiForm";
import { ClientiTable } from "@/components/anagrafiche/ClientiTable";
import { useSearchParams } from "react-router-dom";
import { Download, Upload } from "lucide-react";
import { showSuccess, showError, showInfo } from "@/utils/toast";
import { exportTableToExcel, exportTemplateToExcel } from "@/utils/export"; // Import exportTemplateToExcel
import { importDataFromExcel } from "@/utils/import";
import { supabase } from "@/integrations/supabase/client";
import { ImportSummaryDialog } from "@/components/anagrafiche/ImportSummaryDialog"; // Import the new dialog

const ClientiPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") || "lista-clienti"; // Changed default tab
  const [isSummaryDialogOpen, setIsSummaryDialogOpen] = useState(false);
  const [importSummary, setImportSummary] = useState<any>(null);

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  useEffect(() => {
    if (!searchParams.get("tab")) {
      setSearchParams({ tab: "lista-clienti" }); // Changed default tab
    }
  }, [searchParams, setSearchParams]);

  const handleExport = async () => {
    const tableName = "clienti";
    const columnsToSelect = ["id", "created_at", "nome_cliente", "codice_fiscale", "partita_iva", "indirizzo", "citta", "cap", "provincia", "telefono", "email", "pec", "sdi", "attivo", "note"];

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
      exportTableToExcel(fetchedData, `Anagrafiche_Clienti`, `Clienti`);
    } else {
      showInfo("Nessun dato da esportare per i Clienti.");
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      showInfo(`Inizio importazione del file "${file.name}" per i Clienti...`);
      const result = await importDataFromExcel(file, "clienti");

      setImportSummary(result); // Use the whole result object
      setIsSummaryDialogOpen(true); // Always open dialog to show summary

      // The dialog will now handle showing success or error messages.
      event.target.value = '';
    }
  };

  const handleDownloadTemplate = () => {
    const headers = ["ragione_sociale", "codice_fiscale", "partita_iva", "indirizzo", "citta", "cap", "provincia", "telefono", "email", "pec", "sdi", "attivo", "note"];
    exportTemplateToExcel(headers, "Template_Clienti", "Clienti");
  };

  return (
    <div className="container mx-auto p-4">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">Gestione Clienti</CardTitle>
          <CardDescription className="text-center">Aggiungi nuovi clienti o visualizza e gestisci quelli esistenti.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-end space-x-2 mb-4">
            <Button onClick={handleDownloadTemplate} variant="outline">
              <Download className="mr-2 h-4 w-4" /> Scarica Template
            </Button>
            <Button onClick={handleExport} variant="outline">
              <Download className="mr-2 h-4 w-4" /> Esporta Excel
            </Button>
            <Label htmlFor="import-clienti-excel" className="flex items-center cursor-pointer">
              <Input id="import-clienti-excel" type="file" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" onChange={handleImport} className="hidden" />
              <Button asChild variant="outline">
                <span><Upload className="mr-2 h-4 w-4" /> Importa Excel</span>
              </Button>
            </Label>
          </div>

          <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2">
              <TabsTrigger value="nuovo-cliente">Nuovo Cliente</TabsTrigger>
              <TabsTrigger value="lista-clienti">Lista Clienti</TabsTrigger>
            </TabsList>
            <TabsContent value="nuovo-cliente" className="mt-4">
              <ClientiForm />
            </TabsContent>
            <TabsContent value="lista-clienti" className="mt-4">
              <ClientiTable />
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

export default ClientiPage;