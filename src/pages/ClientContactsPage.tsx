import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from 'lucide-react';
import { ClientContactsTable } from "@/components/anagrafiche/ClientContactsTable";
import { showInfo } from '@/utils/toast';

const ClientContactsPage = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();

  if (!clientId) {
    showInfo("ID cliente non fornito. Reindirizzamento alla lista clienti.");
    navigate('/anagrafiche/clienti');
    return null;
  }

  return (
    <div className="container mx-auto p-4">
      <Card className="w-full max-w-6xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={() => navigate('/anagrafiche/clienti')}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Torna ai Clienti
            </Button>
            <CardTitle className="text-3xl font-bold text-center flex-1">Rubrica Contatti Cliente</CardTitle>
            <div className="w-24"></div> {/* Placeholder for alignment */}
          </div>
          <CardDescription className="text-center">Gestisci i contatti associati a questo cliente.</CardDescription>
        </CardHeader>
        <CardContent>
          <ClientContactsTable clientId={clientId} />
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientContactsPage;