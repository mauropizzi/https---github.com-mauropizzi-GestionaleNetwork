import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { InterventionListTable } from "@/components/centrale-operativa/InterventionListTable";

const CentraleOperativa = () => {
  return (
    <div className="container mx-auto p-4">
      <Card className="w-full max-w-full mx-auto"> {/* Increased max-width for better table display */}
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">Centrale Operativa - Interventi Allarme</CardTitle>
          <CardDescription className="text-center">Visualizza e gestisci lo storico degli interventi su allarme.</CardDescription>
        </CardHeader>
        <CardContent>
          <InterventionListTable /> {/* Render the new table component here */}
        </CardContent>
      </Card>
    </div>
  );
};

export default CentraleOperativa;