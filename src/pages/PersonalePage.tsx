import React, { useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PersonaleForm } from "@/components/anagrafiche/PersonaleForm";
import { PersonaleTable } from "@/components/anagrafiche/PersonaleTable";
import { useSearchParams } from "react-router-dom";
import { Download, Upload } from "lucide-react";
import { showSuccess, showError, showInfo } from "@/utils/toast";
import { exportTableToExcel, exportTemplateToExcel } from "@/utils/export"; // Import exportTemplateToExcel
import { importDataFromExcel } from "@/utils/import";
import { supabase } from "@/integrations/supabase/client";

const PersonalePage = () => {
  const [searchParams, setSearchParams] = new URLSearchParams();
  const currentTab = searchParams.get("tab") || "nuovo-personale";

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  useEffect(() => {
    if (!searchParams.get("tab")) {
      setSearchParams({ tab: "nuovo-personale" });
    }
  }, [searchParams, setSearchParams]);

  const handleExport = async () => {
    const tableName = "personale";
    const columnsToSelect = ["id", "created_at", "nome", "cognome", "codice_fiscale", "ruolo", "telefono", "email", "data_nascita", "luogo_nascita", "indirizzo", "cap", "citta", "provincia", "data_assunzione", "data_cessazione", "attivo", "note"];

    const { data, error } = await supabase
      .from(tableName)
      .select(columnsToSelect.join(','));

    if (error) {
      showError(`Errore nel recupero dei dati per l'esportazione: ${error.message}`);
      console.error("Error fetching data for export:", error);
      return;
    }

    if (data && data.length > 0) {
      exportTableToExcel(data, `Anagrafiche_Personale`, `Personale`);
    } else {
      showInfo("Nessun dato da esportare per il Personale.");
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      showInfo(`Inizio importazione del file "${file.name}" per il Personale...`);
      const result = await importDataFromExcel(file, "personale");

      if (result.success) {
        showSuccess(result.message);
      } else {
        showError(result.message);
        if (result.details) {
          if (result.details.duplicateRecords.length > 0) {
            console.warn("Record duplicati ignorati:", result.details.duplicateRecords);
          }
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
    const headers = ["nome", "cognome", "codiceFiscale", "ruolo", "telefono", "email", "data_nascita", "luogo_nascita", "indirizzo", "cap", "citta", "provincia", "data_assunzione", "data_cessazione", "attivo", "note"];
    exportTemplateToExcel(headers, "Template_Personale", "Personale");
  };

  return (
    <div className="container mx-auto p-4">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">Gestione Personale</CardTitle>
          <CardDescription className="text-center">Aggiungi nuovo personale o visualizza e gestisci quello esistente.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-end space-x-2 mb-4">
            <Button onClick={handleDownloadTemplate} variant="outline">
              <Download className="mr-2 h-4 w-4" /> Scarica Template
            </Button>
            <Button onClick={handleExport} variant="outline">
              <Download className="mr-2 h-4 w-4" /> Esporta Excel
            </Button>
            <Label htmlFor="import-personale-excel" className="flex items-center cursor-pointer">
              <Input id="import-personale-excel" type="file" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" onChange={handleImport} className="hidden" />
              <Button asChild variant="outline">
                <span><Upload className="mr-2 h-4 w-4" /> Importa Excel</span>
              </Button>
            </Label>
          </div>

          <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2">
              <TabsTrigger value="nuovo-personale">Nuovo Personale</TabsTrigger>
              <TabsTrigger value="lista-personale">Lista Personale</TabsTrigger>
            </TabsList>
            <TabsContent value="nuovo-personale" className="mt-4">
              <PersonaleForm />
            </TabsContent>
            <TabsContent value="lista-personale" className="mt-4">
              <PersonaleTable />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default PersonalePage;