import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { InterventionListTable } from "@/components/centrale-operativa/InterventionListTable"; // Import the new table component

const CentraleOperativa = () => {
  return (
    <div className="container mx-auto p-4">
      <Card className="w-full max-w-6xl mx-auto"> {/* Increased max-width for better table display */}
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">Centrale Operativa</CardTitle>
          <CardDescription className="text-center">Gestisci le operazioni e gli interventi in tempo reale.</CardDescription>
        </CardHeader>
        <CardContent>
          <InterventionListTable /> {/* Render the new table component here */}
        </CardContent>
      </Card>
    </div>
  );
};

export default CentraleOperativa;