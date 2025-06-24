import React, { useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button"; // Import Button
import { Input } from "@/components/ui/input";     // Import Input
import { Label } from "@/components/ui/label";     // Import Label
import { ClientiForm } from "@/components/anagrafiche/ClientiForm";
import { PuntiServizioForm } from "@/components/anagrafiche/PuntiServizioForm";
import { PersonaleForm } from "@/components/anagrafiche/PersonaleForm";
import { OperatoriNetworkForm } from "@/components/anagrafiche/OperatoriNetworkForm";
import { FornitoriForm } from "@/components/anagrafiche/FornitoriForm";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Download, Upload } from "lucide-react"; // Import icons
import { toast } from "@/utils/toast"; // Import toast for notifications

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
  const getFormSchemaKeys = (tab: string) => {
    switch (tab) {
      case "clienti":
        return ["nomeCliente", "codiceFiscale", "partitaIva", "indirizzo", "citta", "cap", "provincia", "telefono", "email"];
      case "punti-servizio":
        return ["nomePuntoServizio", "idCliente", "indirizzo", "citta", "cap", "provincia", "referente", "telefonoReferente"];
      case "personale":
        return ["nome", "cognome", "codiceFiscale", "ruolo", "telefono", "email"];
      case "operatori-network":
        return ["nomeOperatore", "referente", "telefono", "email", "tipoServizio"];
      case "fornitori":
        return ["nomeFornitore", "partitaIva", "referente", "telefono", "email", "tipoFornitura"];
      default:
        return [];
    }
  };

  const handleExport = () => {
    const keys = getFormSchemaKeys(currentTab);
    if (keys.length === 0) {
      toast.error("Nessun campo definito per l'esportazione per questa scheda.");
      return;
    }

    const header = keys.map(key => `"${key}"`).join(",");
    const sampleRow = keys.map(() => `""`).join(","); // Empty values for sample row
    const csvContent = `${header}\n${sampleRow}`;

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `${currentTab}_sample.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`File ${currentTab}_sample.csv esportato con successo!`);
    } else {
      toast.error("Il tuo browser non supporta il download automatico.");
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log("File selezionato per l'importazione:", file.name);
      toast.info(`File "${file.name}" selezionato per l'importazione. La logica di parsing e importazione deve essere implementata.`);
      // Qui si dovrebbe implementare la logica per leggere il file (es. usando una libreria come 'xlsx' o 'papaparse' per CSV),
      // validare i dati e poi processarli (es. inviarli a un backend o aggiornare lo stato locale).
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
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="clienti">Clienti</TabsTrigger>
              <TabsTrigger value="punti-servizio">Punti Servizio</TabsTrigger>
              <TabsTrigger value="personale">Personale</TabsTrigger>
              <TabsTrigger value="operatori-network">Operatori Network</TabsTrigger>
              <TabsTrigger value="fornitori">Fornitori</TabsTrigger>
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
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Anagrafiche;