import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { showInfo, showError, showSuccess } from "@/utils/toast";
import { supabase } from '@/integrations/supabase/client';
import { InterventionForm } from "@/components/centrale-operativa/InterventionForm"; // Import the refactored form

const EditAlarmEventPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isPublicMode = location.pathname.startsWith('/public/');

  const [loadingEvent, setLoadingEvent] = useState(true); // State to manage loading of event data
  const [eventExists, setEventExists] = useState(false); // State to check if event exists

  useEffect(() => {
    const checkEventExistence = async () => {
      if (!id) {
        showError("ID evento non fornito.");
        if (!isPublicMode) {
          navigate('/centrale-operativa?tab=eventi-in-gestione');
        }
        setLoadingEvent(false);
        return;
      }

      const { data, error } = await supabase
        .from('allarme_interventi')
        .select('id')
        .eq('id', id)
        .single();

      if (error || !data) {
        showError("Evento non trovato o errore nel recupero.");
        console.error("Error checking event existence:", error);
        setEventExists(false);
        if (!isPublicMode) {
          navigate('/centrale-operativa?tab=eventi-in-gestione');
        }
      } else {
        setEventExists(true);
      }
      setLoadingEvent(false);
    };

    checkEventExistence();
  }, [id, navigate, isPublicMode]);

  const handleSaveSuccess = useCallback(() => {
    showSuccess("Modifiche all'evento salvate con successo!");
    if (isPublicMode) {
      navigate('/public/success');
    } else {
      navigate('/centrale-operativa?tab=eventi-in-gestione');
    }
  }, [navigate, isPublicMode]);

  const handleCancel = useCallback(() => {
    showInfo("Modifica evento annullata.");
    if (isPublicMode) {
      // For public mode, just close the window or go to a generic public success/error page
      navigate('/public/success'); // Or window.close() if it's meant to be a popup
    } else {
      navigate('/centrale-operativa?tab=eventi-in-gestione');
    }
  }, [navigate, isPublicMode]);

  if (loadingEvent) {
    return (
      <div className="container mx-auto p-4 text-center">
        <Card className="w-full max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center">Caricamento Evento...</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Caricamento dei dettagli dell'evento di allarme. Attendere prego.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!eventExists) {
    return (
      <div className="container mx-auto p-4 text-center">
        <Card className="w-full max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center">Evento Non Trovato</CardTitle>
          </CardHeader>
          <CardContent>
            <p>L'evento di allarme richiesto non è stato trovato o l'ID non è valido.</p>
            {!isPublicMode && (
              <Button onClick={() => navigate('/centrale-operativa?tab=eventi-in-gestione')} className="mt-4">
                Torna agli Eventi in Gestione
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">Modifica Evento Allarme</CardTitle>
          <CardDescription className="text-center">Apporta modifiche ai dettagli dell'evento.</CardDescription>
        </CardHeader>
        <CardContent>
          <InterventionForm eventId={id} onSaveSuccess={handleSaveSuccess} onCancel={handleCancel} isPublicMode={isPublicMode} />
        </CardContent>
      </Card>
    </div>
  );
};

export default EditAlarmEventPage;