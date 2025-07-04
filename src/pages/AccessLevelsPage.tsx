import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { UserRoleTable } from "@/components/access-levels/UserRoleTable";
import { Shield } from "lucide-react";

const AccessLevelsPage = () => {
  return (
    <div className="container mx-auto p-4">
      <Card className="w-full max-w-6xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">
            <Shield className="inline-block h-8 w-8 mr-2 text-blue-500" /> Gestione Livelli di Accesso
          </CardTitle>
          <CardDescription className="text-center">
            Visualizza e gestisci i ruoli degli utenti del sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UserRoleTable />
        </CardContent>
      </Card>
    </div>
  );
};

export default AccessLevelsPage;