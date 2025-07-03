import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { showError } from "@/utils/toast";
import { MaintenanceRequestEditForm } from "@/components/manutenzione/MaintenanceRequestEditForm";

const EditMaintenanceRequestPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const handleSaveSuccess = () => {
    navigate('/richiesta-manutenzione'); // Navigate back to the list page
  };

  const handleCancel = () => {
    navigate('/richiesta-manutenzione'); // Navigate back to the list page
  };

  if (!id) {
    showError("ID richiesta di manutenzione non fornito.");
    navigate('/richiesta-manutenzione');
    return null;
  }

  return (
    <div className="container mx-auto p-4">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">Modifica Richiesta di Manutenzione</CardTitle>
          <CardDescription className="text-center">Apporta modifiche alla richiesta selezionata.</CardDescription>
        </CardHeader>
        <CardContent>
          <MaintenanceRequestEditForm requestId={id} onSaveSuccess={handleSaveSuccess} onCancel={handleCancel} />
        </CardContent>
      </Card>
    </div>
  );
};

export default EditMaintenanceRequestPage;