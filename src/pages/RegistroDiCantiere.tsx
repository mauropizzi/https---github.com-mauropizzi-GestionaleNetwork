import React, { useState, useCallback, useEffect } from "react"; // Import useEffect
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CantiereForm } from "@/components/cantiere/CantiereForm";
import { CantiereHistoryTable } from "@/components/cantiere/CantiereHistoryTable";
import { useSearchParams } from "react-router-dom";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CantiereProcedureDescriptionDialog } from "@/components/cantiere/CantiereProcedureDescriptionDialog";
import { fetchProcedure } from "@/lib/data-fetching";
import { Procedure } from "@/lib/anagrafiche-data";
import { showInfo, showError } from "@/utils/toast";

const RegistroDiCantiere = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentTab, setCurrentTab] = useState(searchParams.get("tab") || "nuovo-rapporto");
  const [isDescriptionDialogOpen, setIsDescriptionDialogOpen] = useState(false);
  const [selectedProcedureForDescription, setSelectedProcedureForDescription] = useState<Procedure | null>(null);

  const restoreId = searchParams.get("restoreId"); // Get restoreId from URL

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam) {
      setCurrentTab(tabParam);
    } else {
      setSearchParams({ tab: "nuovo-rapporto" });
    }
  }, [searchParams, setSearchParams]);

  const handleTabChange = (value: string) => {
    setCurrentTab(value);
    // Clear restoreId when changing tabs
    const newSearchParams = new URLSearchParams(searchParams.toString());
    newSearchParams.delete("restoreId");
    setSearchParams(newSearchParams, { replace: true });
  };

  const handleCancelRestore = useCallback(() => {
    // Go back to the history tab and clear restoreId
    const newSearchParams = new URLSearchParams(searchParams.toString());
    newSearchParams.set("tab", "storico-rapporti");
    newSearchParams.delete("restoreId");
    setSearchParams(newSearchParams, { replace: true });
    setCurrentTab("storico-rapporti"); // Ensure tab changes visually
  }, [searchParams, setSearchParams]);

  const handleViewCantiereProcedure = useCallback(async () => {
    showInfo("Ricerca procedura 'Procedure Cantiere'...");
    const allProcedures = await fetchProcedure();

    const specificProcedure = allProcedures.find(p =>
      p.nome_procedura === 'Procedure Cantiere' && p.versione === '1.0'
    );

    if (specificProcedure) {
      setSelectedProcedureForDescription(specificProcedure);
      setIsDescriptionDialogOpen(true);
    } else {
      showError("La procedura 'Procedure Cantiere' versione '1.0' non è stata trovata.");
      console.warn("Specific procedure 'Procedure Cantiere' version '1.0' not found. Available procedures:", allProcedures.map(p => ({ name: p.nome_procedura, version: p.versione })));
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
              onClick={handleViewCantiereProcedure}
              className="text-blue-600 hover:text-blue-800 flex items-center space-x-1"
              title="Visualizza Procedura Cantiere"
            >
              <FileText className="h-6 w-6" />
              <span>Procedure</span>
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
              <CantiereForm reportId={restoreId || undefined} onCancel={handleCancelRestore} />
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