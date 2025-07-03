import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CantiereForm } from "@/components/cantiere/CantiereForm";
import { CantiereHistoryTable } from "@/components/cantiere/CantiereHistoryTable";
import { useSearchParams } from "react-router-dom";
import { PrefetchLink } from "@/components/layout/PrefetchLink"; // Import PrefetchLink
import { FileText } from "lucide-react"; // Import FileText icon

const RegistroDiCantiere = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") || "nuovo-rapporto"; // Default tab

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  return (
    <div className="container mx-auto p-4">
      <Card className="w-full max-w-6xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-center space-x-2">
            <CardTitle className="text-3xl font-bold text-center">Registro di Cantiere</CardTitle>
            <PrefetchLink to="/anagrafiche/procedure?initialSearch=cantiere">
              <FileText className="h-6 w-6 text-blue-600 hover:text-blue-800 cursor-pointer" title="Vai a Procedure Cantiere" />
            </PrefetchLink>
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
    </div>
  );
};

export default RegistroDiCantiere;