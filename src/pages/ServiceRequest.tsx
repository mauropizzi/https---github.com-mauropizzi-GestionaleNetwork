import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PiantonamentoForm } from "@/components/service-request/PiantonamentoForm";

const ServiceRequest = () => {
  return (
    <div className="container mx-auto p-4">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">Sistema di Richiesta Servizi di Sicurezza</CardTitle>
          <CardDescription className="text-center">Seleziona il tipo di servizio e compila i dettagli.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="ore" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="ore">Servizi in ORE</TabsTrigger>
              <TabsTrigger value="cadenza">Servizi a CADENZA</TabsTrigger>
              <TabsTrigger value="una-tantum">Servizi UNA TANTUM</TabsTrigger>
            </TabsList>
            <TabsContent value="ore" className="mt-4">
              <Tabs defaultValue="piantonamento">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="piantonamento">Piantonamento</TabsTrigger>
                  <TabsTrigger value="fiduciari">Servizi Fiduciari</TabsTrigger>
                </TabsList>
                <TabsContent value="piantonamento" className="mt-4">
                  <PiantonamentoForm />
                </TabsContent>
                <TabsContent value="fiduciari" className="mt-4">
                  <p className="text-center text-gray-500">Form per Servizi Fiduciari (da implementare)</p>
                </TabsContent>
              </Tabs>
            </TabsContent>
            <TabsContent value="cadenza" className="mt-4">
              <p className="text-center text-gray-500">Form per Ispezioni (da implementare)</p>
            </TabsContent>
            <TabsContent value="una-tantum" className="mt-4">
              <Tabs defaultValue="bonifiche">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="bonifiche">Bonifiche</TabsTrigger>
                  <TabsTrigger value="chiavi">Gestione Chiavi</TabsTrigger>
                  <TabsTrigger value="apertura-chiusura">Apertura/Chiusura</TabsTrigger>
                </TabsList>
                <TabsContent value="bonifiche" className="mt-4">
                  <p className="text-center text-gray-500">Form per Bonifiche (da implementare)</p>
                </TabsContent>
                <TabsContent value="chiavi" className="mt-4">
                  <p className="text-center text-gray-500">Form per Gestione Chiavi (da implementare)</p>
                </TabsContent>
                <TabsContent value="apertura-chiusura" className="mt-4">
                  <p className="text-center text-gray-500">Form per Apertura/Chiusura (da implementare)</p>
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