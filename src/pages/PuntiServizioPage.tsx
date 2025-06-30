import React, { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PuntiServizioForm } from "@/components/anagrafiche/PuntiServizioForm";
import { PuntiServizioTable } from "@/components/anagrafiche/PuntiServizioTable";
import { useSearchParams } from "react-router-dom";
import { Download, Upload } from "lucide-react";
import { showSuccess, showError, showInfo } from "@/utils/toast";
import { exportTableToExcel, exportTemplateToExcel } from "@/utils/export"; // Import exportTemplateToExcel
import { importDataFromExcel } from "@/utils/import";
import { supabase } from "@/integrations/supabase/client";
import { ImportSummaryDialog } from "@/components/anagrafiche/ImportSummaryDialog"; // Import the new dialog

const PuntiServizioPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") || "lista-punti-servizio"; // Changed default tab
  const [isSummaryDialogOpen, setIsSummaryDialogOpen] = useState(false);
  const [importSummary, setImportSummary] = useState<any>(null);

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  useEffect(() => {
    if (!searchParams.get("tab")) {
      setSearchParams({ tab: "lista-punti-servizio" }); // Changed default tab
    }
  }, [searchParams, setSearchParams]);

  const handleExport = async () => {
    const tableName = "punti_servizio";
    const columnsToSelect = ["id", "created_at", "nome_punto_servizio", "id_cliente", "indirizzo", "citta", "cap", "provincia", "referente", "telefono_referente", "telefono", "email", "note", "tempo_intervento", "fornitore_id", "codice_cliente", "codice_sicep", "codice_fatturazione", "latitude", "longitude"];

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
      exportTableToExcel(fetchedData, `Anagrafiche_PuntiServizio`, `PuntiServizio`);
    } else {
      showInfo("Nessun dato da esportare per i Punti Servizio.");
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      showInfo(`Inizio importazione del file "${file.name}" per i Punti Servizio...`);
      const result = await importDataFromExcel(file, "punti-servizio");

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
    const headers = ["nomePuntoServizio", "idCliente", "indirizzo", "citta", "cap", "provincia", "referente", "telefonoReferente", "telefono", "email", "note", "tempoIntervento", "fornitoreId", "codiceCliente", "codiceSicep", "codiceFatturazione", "latitude", "longitude"];
    exportTemplateToExcel(headers, "Template_PuntiServizio", "PuntiServizio");
  };

  return (
    <div className="container mx-auto p-4">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">Gestione Punti Servizio</CardTitle>
          <CardDescription className="text-center">Aggiungi nuovi punti servizio o visualizza e gestisci quelli esistenti.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-end space-x-2 mb-4">
            <Button onClick={handleDownloadTemplate} variant="outline">
              <Download className="mr-2 h-4 w-4" /> Scarica Template
            </Button>
            <Button onClick={handleExport} variant="outline">
              <Download className="mr-2 h-4 w-4" /> Esporta Excel
            </Button>
            <Label htmlFor="import-punti-servizio-excel" className="flex items-center cursor-pointer">
              <Input id="import-punti-servizio-excel" type="file" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" onChange={handleImport} className="hidden" />
              <Button asChild variant="outline">
                <span><Upload className="mr-2 h-4 w-4" /> Importa Excel</span>
              </Button>
            </Label>
          </div>

          <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2">
              <TabsTrigger value="nuovo-punto-servizio">Nuovo Punto Servizio</TabsTrigger>
              <TabsTrigger value="lista-punti-servizio">Lista Punti Servizio</TabsTrigger>
            </TabsList>
            <TabsContent value="nuovo-punto-servizio" className="mt-4">
              <PuntiServizioForm />
            </TabsContent>
            <TabsContent value="lista-punti-servizio" className="mt-4">
              <PuntiServizioTable />
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

export default PuntiServizioPage;