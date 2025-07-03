import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { showError } from "@/utils/toast";
import { ServiceReportEditForm } from "@/components/dotazioni-di-servizio/ServiceReportEditForm";

const EditServiceReportPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const handleSaveSuccess = () => {
    navigate('/dotazioni-di-servizio?tab=storico-rapporti');
  };

  const handleCancel = () => {
    navigate('/dotazioni-di-servizio?tab=storico-rapporti');
  };

  if (!id) {
    showError("ID rapporto non fornito.");
    navigate('/dotazioni-di-servizio?tab=storico-rapporti');
    return null;
  }

  return (
    <div className="container mx-auto p-4">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">Modifica Rapporto Dotazioni di Servizio</CardTitle>
          <CardDescription className="text-center">Apporta modifiche al rapporto selezionato.</CardDescription>
        </CardHeader>
        <CardContent>
          <ServiceReportEditForm reportId={id} onSaveSuccess={handleSaveSuccess} onCancel={handleCancel} />
        </CardContent>
      </Card>
    </div>
  );
};

export default EditServiceReportPage;