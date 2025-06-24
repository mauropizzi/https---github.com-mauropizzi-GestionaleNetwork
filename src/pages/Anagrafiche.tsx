import React, { useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientiForm } from "@/components/anagrafiche/ClientiForm";
import { PuntiServizioForm } from "@/components/anagrafiche/PuntiServizioForm";
import { PersonaleForm } from "@/components/anagrafiche/PersonaleForm";
import { OperatoriNetworkForm } from "@/components/anagrafiche/OperatoriNetworkForm";
import { FornitoriForm } from "@/components/anagrafiche/FornitoriForm";
import { useSearchParams, useNavigate } from "react-router-dom";

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

  return (
    <div className="container mx-auto p-4">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">Gestione Anagrafiche</CardTitle>
          <CardDescription className="text-center">Gestisci i dati di clienti, punti servizio, personale, operatori network e fornitori.</CardDescription>
        </CardHeader>
        <CardContent>
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