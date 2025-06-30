import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const AnalisiContabile = () => {
  return (
    <div className="container mx-auto p-4">
      <Card className="w-full max-w-6xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">Analisi Contabile</CardTitle>
          <CardDescription className="text-center">
            Qui puoi visualizzare e gestire i dati per l'analisi contabile.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">
            <p className="mb-4">In questa sezione potrai integrare grafici, tabelle e report per l'analisi finanziaria.</p>
            <p>Aggiungi qui i tuoi componenti per l'analisi contabile.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalisiContabile;