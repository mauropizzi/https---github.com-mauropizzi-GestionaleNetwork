import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CanoneForm } from "@/components/canone/CanoneForm";

const ServiziCanone = () => {
  return (
    <div className="container mx-auto p-4">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">Gestione Servizi a Canone</CardTitle>
          <CardDescription className="text-center">Registra e gestisci i servizi con canone mensile.</CardDescription>
        </CardHeader>
        <CardContent>
          <CanoneForm />
        </CardContent>
      </Card>
    </div>
  );
};

export default ServiziCanone;