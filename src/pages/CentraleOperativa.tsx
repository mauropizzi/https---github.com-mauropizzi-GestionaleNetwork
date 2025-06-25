import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const CentraleOperativa = () => {
  return (
    <div className="container mx-auto p-4">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">Centrale Operativa</CardTitle>
          <CardDescription className="text-center">Gestisci le operazioni e gli interventi in tempo reale.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-600 dark:text-gray-400">
            Questa è la pagina della Centrale Operativa. Qui verranno visualizzate le funzionalità per la gestione degli interventi.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default CentraleOperativa;