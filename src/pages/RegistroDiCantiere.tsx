import React, { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CantiereForm } from "@/components/cantiere/CantiereForm";
import { CantiereHistoryTable } from "@/components/cantiere/CantiereHistoryTable";
import { useSearchParams } from "react-router-dom";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CantiereProcedureDescriptionDialog } from "@/components/cantiere/CantiereProcedureDescriptionDialog"; // Import the new dialog
import { fetchProcedure } from "@/lib/data-fetching";
import { Procedure } from "@/lib/anagrafiche-data";
import { showInfo } from "@/utils/toast";

const RegistroDiCantiere = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") || "nuovo-rapporto";
  const [isDescriptionDialogOpen, setIsDescriptionDialogOpen] = useState(false); // State for new dialog visibility
  const [selectedProcedureForDescription, setSelectedProcedureForDescription] = useState<Procedure | null>(null); // State for selected procedure

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  const handleViewCantiereProcedure = useCallback(async () => {
    showInfo("Ricerca procedure per cantiere...");
    const allProcedures = await fetchProcedure();
    const cantiereProcedures = allProcedures.filter(p =>
      p.nome_procedura.toLowerCase().includes('cantiere') ||
      (p.descrizione?.toLowerCase().includes('cantiere'))
    );

    if (cantiereProcedures.length > 0) {
      setSelectedProcedureForDescription(cantiereProcedures[0]); // Select the first one found
      setIsDescriptionDialogOpen(true); // Open the new description dialog
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
      {selectedProcedureForDescription && (
        <CantiereProcedureDescriptionDialog
          isOpen={isDescriptionDialogOpen}
          onClose={() => setIsDescriptionDialogOpen(false)}
          procedure={selectedProcedureForDescription}
        />
      )}
    </div>
  );
};

export default RegistroDiCantiere;