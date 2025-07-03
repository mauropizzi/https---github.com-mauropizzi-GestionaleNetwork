import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Wrench } from "lucide-react";

const RichiestaManutenzione = () => {
  return (
    <div className="container mx-auto p-4">
      <Card className="w-full max-w-2xl mx-auto text-center">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">
            <Wrench className="inline-block h-8 w-8 mr-2 text-blue-500" /> Richiesta Manutenzione
          </CardTitle>
          <CardDescription>
            Questa è la pagina per la gestione delle richieste di manutenzione.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-lg text-gray-700 dark:text-gray-300">
            La funzionalità per la richiesta di manutenzione sarà implementata qui.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Rimani sintonizzato per gli aggiornamenti!
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default RichiestaManutenzione;