import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InterventionForm } from "@/components/centrale-operativa/InterventionForm";
import { InterventionListTable } from "@/components/centrale-operativa/InterventionListTable";
import { AlarmEventsInProgressTable } from "@/components/centrale-operativa/AlarmEventsInProgressTable"; // Import the new component
import { useSearchParams } from "react-router-dom";

const CentraleOperativa = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") || "gestione-intervento"; // Default tab

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  // Effect to ensure a default tab is set if none is present in the URL
  useEffect(() => {
    if (!searchParams.get("tab")) {
      setSearchParams({ tab: "gestione-intervento" });
    }
  }, [searchParams, setSearchParams]);

  return (
    <div className="container mx-auto p-4">
      <Card className="w-full max-w-6xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">Registrazione Interventi e Ispezioni</CardTitle>
          <CardDescription className="text-center">Registra nuovi interventi e ispezioni e visualizza lo storico.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-3"> {/* Changed grid-cols to 3 */}
              <TabsTrigger value="gestione-intervento">Inserisci Evento Allarme</TabsTrigger>
              <TabsTrigger value="storico-interventi">Storico Eventi Allarme</TabsTrigger>
              <TabsTrigger value="eventi-in-gestione">Eventi Allarme in Gestione</TabsTrigger> {/* New tab trigger */}
            </TabsList>
            <TabsContent value="gestione-intervento" className="mt-4">
              <InterventionForm />
            </TabsContent>
            <TabsContent value="storico-interventi" className="mt-4">
              <InterventionListTable />
            </TabsContent>
            <TabsContent value="eventi-in-gestione" className="mt-4"> {/* New tab content */}
              <AlarmEventsInProgressTable />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default CentraleOperativa;