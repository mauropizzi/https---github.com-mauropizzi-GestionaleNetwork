import React, { useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PiantonamentoForm } from "@/components/service-request/PiantonamentoForm";
import { ServiziFiduciariForm } from "@/components/service-request/ServiziFiduciariForm";
import { IspezioniForm } from "@/components/service-request/IspezioniForm";
import { BonificheForm } from "@/components/service-request/BonificheForm";
import { GestioneChiaviForm } from "@/components/service-request/GestioneChiaviForm";
import { AperturaChiusuraForm } from "@/components/service-request/AperturaChiusuraForm";
import { useSearchParams, useNavigate } from "react-router-dom";

const ServiceRequest = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const currentTab = searchParams.get("tab") || "piantonamento"; // Default tab for "ore" category

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  // Effect to ensure the correct sub-tab is active when navigating directly
  useEffect(() => {
    const oreTabs = ["piantonamento", "fiduciari"];
    const unaTantumTabs = ["bonifiche", "chiavi", "apertura-chiusura"];

    if (oreTabs.includes(currentTab)) {
      // Ensure the parent tab "ore" is active
      // This is handled by the default value of the parent Tabs component
    } else if (currentTab === "ispezioni") {
      // Ensure the parent tab "cadenza" is active
    } else if (unaTantumTabs.includes(currentTab)) {
      // Ensure the parent tab "una-tantum" is active
    } else {
      // If an invalid tab is in the URL, redirect to a default valid one
      if (!searchParams.get("tab")) {
        setSearchParams({ tab: "piantonamento" });
      }
    }
  }, [currentTab, searchParams, setSearchParams]);

  const getParentTab = (subTab: string) => {
    const oreTabs = ["piantonamento", "fiduciari"];
    const unaTantumTabs = ["bonifiche", "chiavi", "apertura-chiusura"];

    if (oreTabs.includes(subTab)) return "ore";
    if (subTab === "ispezioni") return "cadenza";
    if (unaTantumTabs.includes(subTab)) return "una-tantum";
    return "ore"; // Default to 'ore' if no match
  };

  return (
    <div className="container mx-auto p-4">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">Sistema di Richiesta Servizi di Sicurezza</CardTitle>
          <CardDescription className="text-center">Seleziona il tipo di servizio e compila i dettagli.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={getParentTab(currentTab)} onValueChange={(value) => handleTabChange(value === "cadenza" ? "ispezioni" : value === "ore" ? "piantonamento" : "bonifiche")} className="w-full">
            <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3">
              <TabsTrigger value="ore">Servizi in ORE</TabsTrigger>
              <TabsTrigger value="cadenza">Ispezioni</TabsTrigger>
              <TabsTrigger value="una-tantum">Servizi UNA TANTUM</TabsTrigger>
            </TabsList>
            <TabsContent value="ore" className="mt-4">
              <Tabs value={currentTab} onValueChange={handleTabChange}>
                <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2">
                  <TabsTrigger value="piantonamento">Piantonamento</TabsTrigger>
                  <TabsTrigger value="fiduciari">Servizi Fiduciari</TabsTrigger>
                </TabsList>
                <TabsContent value="piantonamento" className="mt-4">
                  <PiantonamentoForm />
                </TabsContent>
                <TabsContent value="fiduciari" className="mt-4">
                  <ServiziFiduciariForm />
                </TabsContent>
              </Tabs>
            </TabsContent>
            <TabsContent value="cadenza" className="mt-4">
              <IspezioniForm />
            </TabsContent>
            <TabsContent value="una-tantum" className="mt-4">
              <Tabs value={currentTab} onValueChange={handleTabChange}>
                <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3">
                  <TabsTrigger value="bonifiche">Bonifiche</TabsTrigger>
                  <TabsTrigger value="chiavi">Gestione Chiavi</TabsTrigger>
                  <TabsTrigger value="apertura-chiusura">Apertura/Chiusura</TabsTrigger>
                </TabsList>
                <TabsContent value="bonifiche" className="mt-4">
                  <BonificheForm />
                </TabsContent>
                <TabsContent value="chiavi" className="mt-4">
                  <GestioneChiaviForm />
                </TabsContent>
                <TabsContent value="apertura-chiusura" className="mt-4">
                  <AperturaChiusuraForm />
                </TabsContent>
              </Tabs>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ServiceRequest;