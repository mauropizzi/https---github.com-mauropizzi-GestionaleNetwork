import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useUserRole } from '@/hooks/use-user-role';
import Unauthorized from './Unauthorized';
import { UserAccessTable } from '@/components/access-management/UserAccessTable';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { UserCreateDialog } from '@/components/access-management/UserCreateDialog';

const AccessManagementPage = () => {
  const { userProfile, loading } = useUserRole();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0); // State to trigger table refresh

  if (loading) {
    return (
      <div className="container mx-auto p-4 text-center">
        <p>Verifica autorizzazioni in corso...</p>
      </div>
    );
  }

  if (userProfile?.role !== 'Amministratore') {
    return <Unauthorized />;
  }

  const handleUserCreated = () => {
    setIsCreateDialogOpen(false);
    setRefreshKey(oldKey => oldKey + 1);
  };

  return (
    <div className="container mx-auto p-4">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">Gestione Accessi Utenti</CardTitle>
          <CardDescription className="text-center">
            Visualizza, crea e modifica i ruoli e i permessi degli utenti registrati nel sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-end mb-4">
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" /> Crea Nuovo Utente
            </Button>
          </div>
          <UserAccessTable key={refreshKey} />
        </CardContent>
      </Card>
      <UserCreateDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onUserCreated={handleUserCreated}
      />
    </div>
  );
};

export default AccessManagementPage;