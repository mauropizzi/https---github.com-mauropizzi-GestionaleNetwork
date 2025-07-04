import React, { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FornitoriForm } from "@/components/anagrafiche/FornitoriForm";
import { FornitoriTable } from "@/components/anagrafiche/FornitoriTable";
import { useSearchParams } from "react-router-dom";
import { Download, Upload } from "lucide-react";
import { showSuccess, showError, showInfo } from "@/utils/toast";
import { exportTableToExcel, exportTemplateToExcel } from "@/utils/export"; // Import exportTemplateToExcel
import { importDataFromExcel } from "@/utils/import";
import { supabase } from "@/integrations/supabase/client";
import { ImportSummaryDialog } from "@/components/anagrafiche/ImportSummaryDialog"; // Import the new dialog

const FornitoriPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") || "lista-fornitori"; // Changed default tab
  const [isSummaryDialogOpen, setIsSummaryDialogOpen] = useState(false);
  const [importSummary, setImportSummary] = useState<any>(null);

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  useEffect(() => {
    if (!searchParams.get("tab")) {
      setSearchParams({ tab: "lista-fornitori" }); // Changed default tab
    }
  }, [searchParams, setSearchParams]);

  const handleExport = async () => {
    const tableName = "fornitori";
    const columnsToSelect = ["id", "created_at", "nome_fornitore", "partita_iva", "codice_fiscale", "referente", "telefono", "email", "tipo_fornitura", "indirizzo", "cap", "citta", "provincia", "pec", "attivo", "note"];

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
      exportTableToExcel(fetchedData, `Anagrafiche_Fornitori`, `Fornitori`);
    } else {
      showInfo("Nessun dato da esportare per i Fornitori.");
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      showInfo(`Inizio importazione del file "${file.name}" per i Fornitori...`);
      const result = await importDataFromExcel(file, "fornitori");

      setImportSummary(result); // Pass the entire result object
      setIsSummaryDialogOpen(true); // Always open dialog to show summary

      // The dialog will now handle showing success or error messages.
      event.target.value = '';
    }
  };

  const handleDownloadTemplate = () => {
    const headers = ["ragione_sociale", "partita_iva", "codice_fiscale", "indirizzo", "cap", "citta", "provincia", "telefono", "email", "pec", "tipo_servizio", "attivo", "note"];
    exportTemplateToExcel(headers, "Template_Fornitori", "Fornitori");
  };

  return (
    <div className="container mx-auto p-4">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">Gestione Fornitori</CardTitle>
          <CardDescription className="text-center">Aggiungi nuovi fornitori o visualizza e gestisci quelli esistenti.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-end space-x-2 mb-4">
            <Button onClick={handleDownloadTemplate} variant="outline">
              <Download className="mr-2 h-4 w-4" /> Scarica Template
            </Button>
            <Button onClick={handleExport} variant="outline">
              <Download className="mr-2 h-4 w-4" /> Esporta Excel
            </Button>
            <Label htmlFor="import-fornitori-excel" className="flex items-center cursor-pointer">
              <Input id="import-fornitori-excel" type="file" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" onChange={handleImport} className="hidden" />
              <Button asChild variant="outline">
                <span><Upload className="mr-2 h-4 w-4" /> Importa Excel</span>
              </Button>
            </Label>
          </div>

          <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2">
              <TabsTrigger value="nuovo-fornitore">Nuovo Fornitore</TabsTrigger>
              <TabsTrigger value="lista-fornitori">Lista Fornitori</TabsTrigger>
            </TabsList>
            <TabsContent value="nuovo-fornitore" className="mt-4">
              <FornitoriForm />
            </TabsContent>
            <TabsContent value="lista-fornitori" className="mt-4">
              <FornitoriTable />
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

export default FornitoriPage;