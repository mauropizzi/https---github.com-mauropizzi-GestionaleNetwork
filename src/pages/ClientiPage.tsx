import React, { useEffect } from "react";
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
import { exportTableToExcel } from "@/utils/export";
import { importDataFromExcel } from "@/utils/import";
import { supabase } from "@/integrations/supabase/client";

const ClientiPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") || "nuovo-cliente";

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  useEffect(() => {
    if (!searchParams.get("tab")) {
      setSearchParams({ tab: "nuovo-cliente" });
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

    if (data && data.length > 0) {
      exportTableToExcel(data, `Anagrafiche_Clienti`, `Clienti`);
    } else {
      showInfo("Nessun dato da esportare per i Clienti.");
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      showInfo(`Inizio importazione del file "${file.name}" per i Clienti...`);
      const result = await importDataFromExcel(file, "clienti");

      if (result.success) {
        showSuccess(result.message);
        // Potresti voler aggiornare la tabella dopo l'importazione
        // Ad esempio, se ClientiTable avesse una prop `onDataChange` o un modo per forzare il refresh
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

  return (
    <div className="container mx-auto p-4">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">Gestione Clienti</CardTitle>
          <CardDescription className="text-center">Aggiungi nuovi clienti o visualizza e gestisci quelli esistenti.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-end space-x-2 mb-4">
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
    </div>
  );
};

export default ClientiPage;