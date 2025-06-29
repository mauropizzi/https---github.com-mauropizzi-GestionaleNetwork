import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { OperatoriNetworkTable } from "@/components/anagrafiche/OperatoriNetworkTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Upload } from "lucide-react";
import { showSuccess, showError, showInfo } from "@/utils/toast";
import { exportTableToExcel } from "@/utils/export";
import { importDataFromExcel } from "@/utils/import";
import { supabase } from "@/integrations/supabase/client";

const OperatoriNetworkList = () => {
  const handleExport = async () => {
    const tableName = "operatori_network";
    const columnsToSelect = ["id", "created_at", "nome_operatore", "referente", "telefono", "email", "tipo_servizio"];

    const { data, error } = await supabase
      .from(tableName)
      .select(columnsToSelect.join(','));

    if (error) {
      showError(`Errore nel recupero dei dati per l'esportazione: ${error.message}`);
      console.error("Error fetching data for export:", error);
      return;
    }

    if (data && data.length > 0) {
      exportTableToExcel(data, `Anagrafiche_OperatoriNetwork`, `OperatoriNetwork`);
    } else {
      showInfo("Nessun dato da esportare per gli Operatori Network.");
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      showInfo(`Inizio importazione del file "${file.name}" per gli Operatori Network...`);
      const result = await importDataFromExcel(file, "operatori-network"); // Use base tab name for import utility

      if (result.success) {
        showSuccess(result.message);
        // You might want to trigger a refresh of the table here if it's not handled by the table component itself
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
      event.target.value = ''; // Clear the input field
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card className="w-full max-w-6xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">Elenco Operatori Network</CardTitle>
          <CardDescription className="text-center">Visualizza e gestisci tutti gli operatori network registrati.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-end space-x-2 mb-4">
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
          <OperatoriNetworkTable />
        </CardContent>
      </Card>
    </div>
  );
};

export default OperatoriNetworkList;