import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ServiceTable } from "@/components/service-request/ServiceTable";

const ServiceList = () => {
  return (
    <div className="container mx-auto p-4">
      <Card className="w-full max-w-6xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">Elenco Servizi Richiesti</CardTitle>
          <CardDescription className="text-center">Visualizza e gestisci tutti i servizi di sicurezza richiesti.</CardDescription>
        </CardHeader>
        <CardContent>
          <ServiceTable />
        </CardContent>
      </Card>
    </div>
  );
};

export default ServiceList;