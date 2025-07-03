import React, { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CantiereForm } from "@/components/cantiere/CantiereForm";
import { CantiereHistoryTable } from "@/components/cantiere/CantiereHistoryTable";
import { useSearchParams } from "react-router-dom";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProcedureDetailsDialog } from "@/components/anagrafiche/ProcedureDetailsDialog"; // Import the details dialog
import { fetchProcedure } from "@/lib/data-fetching"; // Import the data fetching utility
import { Procedure } from "@/lib/anagrafiche-data"; // Import the Procedure interface
import { showInfo } from "@/utils/toast"; // Import toast for messages

const RegistroDiCantiere = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") || "nuovo-rapporto";
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false); // State for dialog visibility
  const [selectedProcedureForDetails, setSelectedProcedureForDetails] = useState<Procedure | null>(null); // State for selected procedure

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  const handleViewCantiereProcedure = useCallback(async () => {
    showInfo("Ricerca procedure per cantiere...");
    const allProcedures = await fetchProcedure(); // Fetch all procedures
    const cantiereProcedures = allProcedures.filter(p =>
      p.nome_procedura.toLowerCase().includes('cantiere') ||
      (p.descrizione?.toLowerCase().includes('cantiere'))
    );

    if (cantiereProcedures.length > 0) {
      setSelectedProcedureForDetails(cantiereProcedures[0]); // Select the first one found
      setIsDetailsDialogOpen(true);
    } else {
      showInfo("Nessuna procedura relativa ai cantieri trovata.");
    }
  }, []);

  return (
    <div className="container mx-auto p-4">
      <Card className="w-full max-w-6xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-center space-x-2">
            <CardTitle className="text-3xl font-bold text-center">Registro di Cantiere</CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleViewCantiereProcedure}
              className="text-blue-600 hover:text-blue-800"
              title="Visualizza Procedura Cantiere"
            >
              <FileText className="h-6 w-6" />
            </Button>
          </div>
          <CardDescription className="text-center">Registra nuovi rapporti di cantiere e visualizza lo storico.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="nuovo-rapporto">Nuovo Rapporto</TabsTrigger>
              <TabsTrigger value="storico-rapporti">Storico Rapporti</TabsTrigger>
            </TabsList>
            <TabsContent value="nuovo-rapporto" className="mt-4">
              <CantiereForm />
            </TabsContent>
            <TabsContent value="storico-rapporti" className="mt-4">
              <CantiereHistoryTable />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      {selectedProcedureForDetails && (
        <ProcedureDetailsDialog
          isOpen={isDetailsDialogOpen}
          onClose={() => setIsDetailsDialogOpen(false)}
          procedure={selectedProcedureForDetails}
        />
      )}
    </div>
  );
};

export default RegistroDiCantiere;