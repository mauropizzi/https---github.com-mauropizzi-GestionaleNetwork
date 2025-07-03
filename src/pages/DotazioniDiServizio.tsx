import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ServiceReportForm from "@/components/dotazioni-di-servizio/ServiceReportForm";
import { DotazioniHistoryTable } from "@/components/dotazioni-di-servizio/DotazioniHistoryTable";
import { useSearchParams } from "react-router-dom";

const DotazioniDiServizio = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") || "nuovo-rapporto";

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  return (
    <div className="container mx-auto p-4">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">Rapporto Dotazioni di Servizio</CardTitle>
          <CardDescription className="text-center">Compila nuovi rapporti e visualizza lo storico.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="nuovo-rapporto">Nuovo Rapporto</TabsTrigger>
              <TabsTrigger value="storico-rapporti">Storico Rapporti</TabsTrigger>
            </TabsList>
            <TabsContent value="nuovo-rapporto" className="mt-4">
              <ServiceReportForm />
            </TabsContent>
            <TabsContent value="storico-rapporti" className="mt-4">
              <DotazioniHistoryTable />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default DotazioniDiServizio;