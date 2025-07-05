import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { useUserRole } from '@/hooks/use-user-role';
import Unauthorized from './Unauthorized';
import { UserAccessTable } from '@/components/access-management/UserAccessTable';
import { UserCreateDialog } from '@/components/access-management/UserCreateDialog'; // Import the new dialog

const AccessManagementPage = () => {
  const { userProfile, loading } = useUserRole();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const handleCreateUserSuccess = () => {
    setIsCreateDialogOpen(false);
    // The UserAccessTable will automatically refetch data when its refresh button is clicked,
    // or we can trigger a refresh here if needed. For now, let's rely on manual refresh or
    // assume the table's internal state management is sufficient.
  };

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

  return (
    <div className="container mx-auto p-4">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">Gestione Accessi Utenti</CardTitle>
          <CardDescription className="text-center">
            Visualizza e modifica i ruoli degli utenti registrati nel sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-end mb-4">
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" /> Crea Nuovo Utente
            </Button>
          </div>
          <UserAccessTable />
        </CardContent>
      </Card>

      <UserCreateDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSaveSuccess={handleCreateUserSuccess}
      />
    </div>
  );
};

export default AccessManagementPage;