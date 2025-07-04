import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClientContactForm } from "@/components/anagrafiche/ClientContactForm";
import { ClientContactTable } from "@/components/anagrafiche/ClientContactTable";
import { showInfo, showError } from "@/utils/toast";
import { supabase } from "@/integrations/supabase/client";
import { Cliente } from "@/lib/anagrafiche-data";

const ClientContactsPage = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const [currentTab, setCurrentTab] = useState("lista-contatti");
  const [clientName, setClientName] = useState("Caricamento...");
  const [loadingClient, setLoadingClient] = useState(true);

  useEffect(() => {
    const fetchClientDetails = async () => {
      if (!clientId) {
        showError("ID cliente non fornito.");
        navigate('/anagrafiche/clienti');
        return;
      }
      setLoadingClient(true);
      const { data, error } = await supabase
        .from('clienti')
        .select('nome_cliente')
        .eq('id', clientId)
        .single();

      if (error) {
        showError(`Errore nel recupero del cliente: ${error.message}`);
        console.error("Error fetching client details:", error);
        setClientName("Cliente Sconosciuto");
        // Optionally navigate away if client not found
        // navigate('/anagrafiche/clienti');
      } else if (data) {
        setClientName(data.nome_cliente);
      } else {
        setClientName("Cliente Non Trovato");
      }
      setLoadingClient(false);
    };

    fetchClientDetails();
  }, [clientId, navigate]);

  const handleSaveSuccess = useCallback(() => {
    showInfo("Contatto salvato con successo. Aggiornamento lista...");
    setCurrentTab("lista-contatti"); // Switch to list tab after saving
  }, []);

  if (!clientId) {
    return (
      <div className="container mx-auto p-4 text-center">
        <Card className="w-full max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center">Errore</CardTitle>
          </CardHeader>
          <CardContent>
            <p>ID cliente non valido o mancante.</p>
            <Button onClick={() => navigate('/anagrafiche/clienti')} className="mt-4">
              Torna alla Lista Clienti
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loadingClient) {
    return (
      <div className="container mx-auto p-4 text-center">
        <Card className="w-full max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center">Caricamento Cliente...</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Caricamento dettagli cliente. Attendere prego.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">Rubrica Contatti: {clientName}</CardTitle>
          <CardDescription className="text-center">Gestisci i contatti associati a questo cliente.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="nuovo-contatto">Nuovo Contatto</TabsTrigger>
              <TabsTrigger value="lista-contatti">Lista Contatti</TabsTrigger>
            </TabsList>
            <TabsContent value="nuovo-contatto" className="mt-4">
              <ClientContactForm clientId={clientId} onSaveSuccess={handleSaveSuccess} />
            </TabsContent>
            <TabsContent value="lista-contatti" className="mt-4">
              <ClientContactTable clientId={clientId} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientContactsPage;