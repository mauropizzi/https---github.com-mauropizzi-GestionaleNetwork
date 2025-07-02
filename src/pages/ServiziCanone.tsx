import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CanoneForm } from "@/components/canone/CanoneForm";
import { CanoneTable } from "@/components/canone/CanoneTable"; // Import the new table component
import { useSearchParams } from "react-router-dom";

const ServiziCanone = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") || "nuovo-servizio-canone"; // Default tab

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  return (
    <div className="container mx-auto p-4">
      <Card className="w-full max-w-6xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">Gestione Servizi a Canone</CardTitle>
          <CardDescription className="text-center">Registra e gestisci i servizi con canone mensile.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="nuovo-servizio-canone">Nuovo Servizio a Canone</TabsTrigger>
              <TabsTrigger value="lista-servizi-canone">Lista Servizi a Canone</TabsTrigger>
            </TabsList>
            <TabsContent value="nuovo-servizio-canone" className="mt-4">
              <CanoneForm />
            </TabsContent>
            <TabsContent value="lista-servizi-canone" className="mt-4">
              <CanoneTable />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ServiziCanone;