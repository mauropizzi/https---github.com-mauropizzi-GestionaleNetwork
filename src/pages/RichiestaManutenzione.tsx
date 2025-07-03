import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Wrench } from "lucide-react";
import { MaintenanceRequestsTable } from "@/components/manutenzione/MaintenanceRequestsTable"; // Import the new table component

const RichiestaManutenzione = () => {
  return (
    <div className="container mx-auto p-4">
      <Card className="w-full max-w-6xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">
            <Wrench className="inline-block h-8 w-8 mr-2 text-blue-500" /> Richieste di Manutenzione
          </CardTitle>
          <CardDescription className="text-center">
            Visualizza e gestisci tutte le richieste di manutenzione dei veicoli.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MaintenanceRequestsTable />
        </CardContent>
      </Card>
    </div>
  );
};

export default RichiestaManutenzione;