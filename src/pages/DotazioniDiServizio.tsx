import React from "react";
import { ServiceReportForm } from "@/components/dotazioni-di-servizio/ServiceReportForm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const DotazioniDiServizio = () => {
  return (
    <div className="container mx-auto p-4">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">Rapporto Dotazioni di Servizio</CardTitle>
          <CardDescription className="text-center">Compila il modulo per registrare le dotazioni e lo stato del veicolo.</CardDescription>
        </CardHeader>
        <CardContent>
          <ServiceReportForm />
        </CardContent>
      </Card>
    </div>
  );
};

export default DotazioniDiServizio;