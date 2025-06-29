import React, { useEffect } from "react";
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
import { exportTableToExcel } from "@/utils/export";
import { importDataFromExcel } from "@/utils/import";
import { supabase } from "@/integrations/supabase/client";

const PuntiServizioPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") || "nuovo-punto-servizio";

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  useEffect(() => {
    if (!searchParams.get("tab")) {
      setSearchParams({ tab: "nuovo-punto-servizio" });
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

    if (data && data.length > 0) {
      exportTableToExcel(data, `Anagrafiche_PuntiServizio`, `PuntiServizio`);
    } else {
      showInfo("Nessun dato da esportare per i Punti Servizio.");
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      showInfo(`Inizio importazione del file "${file.name}" per i Punti Servizio...`);
      const result = await importDataFromExcel(file, "punti-servizio");

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

  return (
    <div className="container mx-auto p-4">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">Gestione Punti Servizio</CardTitle>
          <CardDescription className="text-center">Aggiungi nuovi punti servizio o visualizza e gestisci quelli esistenti.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-end space-x-2 mb-4">
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
            <TabsList className="grid w-full grid-cols-2">
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
    </div>
  );
};

export default PuntiServizioPage;