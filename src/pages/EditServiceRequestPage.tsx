import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { showInfo, showError, showSuccess } from "@/utils/toast";
import { supabase } from '@/integrations/supabase/client';

// Import all service request forms
import { PiantonamentoForm } from "@/components/service-request/PiantonamentoForm";
import { ServiziFiduciariForm } from "@/components/service-request/ServiziFiduciariForm";
import { IspezioniForm } from "@/components/service-request/IspezioniForm";
import { BonificheForm } from "@/components/service-request/BonificheForm";
import { GestioneChiaviForm } from "@/components/service-request/GestioneChiaviForm";
import { AperturaChiusuraForm } from "@/components/service-request/AperturaChiusuraForm";

interface ServiceRequestData {
  id: string;
  type: string;
  // Add other fields if needed for display or routing logic, but the specific form will fetch full data
}

const EditServiceRequestPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [serviceType, setServiceType] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServiceType = async () => {
      if (!id) {
        showError("ID servizio non fornito.");
        navigate('/service-list');
        return;
      }
      setLoading(true);
      const { data, error } = await supabase
        .from('servizi_richiesti')
        .select('type')
        .eq('id', id)
        .single();

      if (error) {
        showError(`Errore nel recupero del tipo di servizio: ${error.message}`);
        console.error("Error fetching service type:", error);
        navigate('/service-list');
      } else if (data) {
        setServiceType(data.type);
      } else {
        showError("Servizio non trovato.");
        navigate('/service-list');
      }
      setLoading(false);
    };
    fetchServiceType();
  }, [id, navigate]);

  const handleSaveSuccess = useCallback(() => {
    showSuccess("Modifiche al servizio salvate con successo!");
    navigate('/service-list');
  }, [navigate]);

  const handleCancel = useCallback(() => {
    showInfo("Modifica servizio annullata.");
    navigate('/service-list');
  }, [navigate]);

  if (loading) {
    return (
      <div className="container mx-auto p-4 text-center">
        <Card className="w-full max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center">Caricamento Servizio...</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Caricamento dei dettagli del servizio. Attendere prego.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!serviceType) {
    return (
      <div className="container mx-auto p-4 text-center">
        <Card className="w-full max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center">Servizio Non Trovato</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Il servizio richiesto non è stato trovato o l'ID non è valido.</p>
            <Button onClick={() => navigate('/service-list')} className="mt-4">
              Torna all'Elenco Servizi
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const renderForm = () => {
    switch (serviceType) {
      case "Piantonamento":
        return <PiantonamentoForm serviceId={id} onSaveSuccess={handleSaveSuccess} onCancel={handleCancel} />;
      case "Servizi Fiduciari":
        return <ServiziFiduciariForm serviceId={id} onSaveSuccess={handleSaveSuccess} onCancel={handleCancel} />;
      case "Ispezioni":
        return <IspezioniForm serviceId={id} onSaveSuccess={handleSaveSuccess} onCancel={handleCancel} />;
      case "Bonifiche":
        return <BonificheForm serviceId={id} onSaveSuccess={handleSaveSuccess} onCancel={handleCancel} />;
      case "Gestione Chiavi":
        return <GestioneChiaviForm serviceId={id} onSaveSuccess={handleSaveSuccess} onCancel={handleCancel} />;
      case "Apertura/Chiusura":
        return <AperturaChiusuraForm serviceId={id} onSaveSuccess={handleSaveSuccess} onCancel={handleCancel} />;
      default:
        return (
          <div className="text-center">
            <p className="text-red-500">Tipo di servizio non riconosciuto: {serviceType}</p>
            <Button onClick={() => navigate('/service-list')} className="mt-4">
              Torna all'Elenco Servizi
            </Button>
          </div>
        );
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">Modifica Servizio: {serviceType}</CardTitle>
          <CardDescription className="text-center">Apporta modifiche ai dettagli del servizio.</CardDescription>
        </CardHeader>
        <CardContent>
          {renderForm()}
        </CardContent>
      </Card>
    </div>
  );
};

export default EditServiceRequestPage;