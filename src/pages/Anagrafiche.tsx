import React, { useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ClientiForm } from "@/components/anagrafiche/ClientiForm";
import { PuntiServizioForm } from "@/components/anagrafiche/PuntiServizioForm";
import { PersonaleForm } from "@/components/anagrafiche/PersonaleForm";
import { OperatoriNetworkForm } from "@/components/anagrafiche/OperatoriNetworkForm";
import { FornitoriForm } from "@/components/anagrafiche/FornitoriForm";
import { TariffeForm } from "@/components/anagrafiche/TariffeForm";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Download, Upload } from "lucide-react";
import { showSuccess, showError, showInfo } from "@/utils/toast";
import { exportTableToExcel } from "@/utils/export"; // Import export utility
import { importDataFromExcel } from "@/utils/import"; // Import import utility
import { supabase } from "@/integrations/supabase/client"; // Import supabase client

const Anagrafiche = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const currentTab = searchParams.get("tab") || "clienti"; // Default tab

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  // Effect to ensure a default tab is set if none is present in the URL
  useEffect(() => {
    if (!searchParams.get("tab")) {
      setSearchParams({ tab: "clienti" });
    }
  }, [searchParams, setSearchParams]);

  // Helper to get schema keys for CSV export
  const getFormSchemaKeys = async (tab: string) => {
    let tableName = "";
    let columnsToSelect: string[] = [];

    switch (tab) {
      case "clienti":
        tableName = "clienti";
        columnsToSelect = ["id", "created_at", "nome_cliente", "codice_fiscale", "partita_iva", "indirizzo", "citta", "cap", "provincia", "telefono", "email", "pec", "sdi", "attivo", "note"];
        break;
      case "punti-servizio":
        tableName = "punti_servizio";
        columnsToSelect = ["id", "created_at", "nome_punto_servizio", "id_cliente", "indirizzo", "citta", "cap", "provincia", "referente", "telefono_referente", "telefono", "email", "note", "tempo_intervento", "fornitore_id", "codice_cliente", "codice_sicep", "codice_fatturazione", "latitude", "longitude"];
        break;
      case "personale":
        tableName = "personale";
        columnsToSelect = ["id", "created_at", "nome", "cognome", "codice_fiscale", "ruolo", "telefono", "email", "data_nascita", "luogo_nascita", "indirizzo", "cap", "citta", "provincia", "data_assunzione", "data_cessazione", "attivo", "note"];
        break;
      case "operatori-network":
        tableName = "operatori_network";
        columnsToSelect = ["id", "created_at", "nome_operatore", "referente", "telefono", "email", "tipo_servizio"];
        break;
      case "fornitori":
        tableName = "fornitori";
        columnsToSelect = ["id", "created_at", "nome_fornitore", "partita_iva", "codice_fiscale", "referente", "telefono", "email", "tipo_fornitura", "indirizzo", "cap", "citta", "provincia", "pec", "attivo", "note"];
        break;
      case "tariffe":
        tableName = "tariffe";
        columnsToSelect = ["id", "created_at", "client_id", "service_type", "client_rate", "supplier_rate", "unita_misura", "punto_servizio_id", "fornitore_id", "data_inizio_validita", "data_fine_validita", "note"];
        break;
      default:
        return { tableName: "", columnsToSelect: [] };
    }
    return { tableName, columnsToSelect };
  };

  const handleExport = async () => {
    const { tableName, columnsToSelect } = await getFormSchemaKeys(currentTab);
    if (!tableName || columnsToSelect.length === 0) {
      showError("Nessun schema definito per l'esportazione per questa scheda.");
      return;
    }

    const { data, error } = await supabase
      .from(tableName)
      .select(columnsToSelect.join(','));

    if (error) {
      showError(`Errore nel recupero dei dati per l'esportazione: ${error.message}`);
      console.error("Error fetching data for export:", error);
      return;
    }

    if (data && data.length > 0) {
      exportTableToExcel(data, `Anagrafiche_${currentTab}`, currentTab);
    } else {
      showInfo("Nessun dato da esportare per questa scheda.");
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      showInfo(`Inizio importazione del file "${file.name}" per la scheda "${currentTab}"...`);
      const result = await importDataFromExcel(file, currentTab);

      if (result.success) {
        // Refresh data in the UI if needed, e.g., by refetching data for tables
        // For now, just show success message.
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
      // Clear the input field to allow re-importing the same file
      event.target.value = '';
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">Gestione Anagrafiche</CardTitle>
          <CardDescription className="text-center">Gestisci i dati di clienti, punti servizio, personale, operatori network e fornitori.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-end space-x-2 mb-4">
            <Button onClick={handleExport} variant="outline">
              <Download className="mr-2 h-4 w-4" /> Esporta Excel
            </Button>
            <Label htmlFor="import-excel" className="flex items-center cursor-pointer">
              <Input id="import-excel" type="file" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" onChange={handleImport} className="hidden" />
              <Button asChild variant="outline">
                <span><Upload className="mr-2 h-4 w-4" /> Importa Excel</span>
              </Button>
            </Label>
          </div>

          <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="clienti">Clienti</TabsTrigger>
              <TabsTrigger value="punti-servizio">Punti Servizio</TabsTrigger>
              <TabsTrigger value="personale">Personale</TabsTrigger>
              <TabsTrigger value="operatori-network">Operatori Network</TabsTrigger>
              <TabsTrigger value="fornitori">Fornitori</TabsTrigger>
              <TabsTrigger value="tariffe">Tariffe</TabsTrigger>
            </TabsList>
            <TabsContent value="clienti" className="mt-4">
              <ClientiForm />
            </TabsContent>
            <TabsContent value="punti-servizio" className="mt-4">
              <PuntiServizioForm />
            </TabsContent>
            <TabsContent value="personale" className="mt-4">
              <PersonaleForm />
            </TabsContent>
            <TabsContent value="operatori-network" className="mt-4">
              <OperatoriNetworkForm />
            </TabsContent>
            <TabsContent value="fornitori" className="mt-4">
              <FornitoriForm />
            </TabsContent>
            <TabsContent value="tariffe" className="mt-4">
              <TariffeForm />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Anagrafiche;