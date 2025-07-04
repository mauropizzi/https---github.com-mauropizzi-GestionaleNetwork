import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useUserRole } from '@/hooks/use-user-role';
import Unauthorized from './Unauthorized';
import { UserAccessTable } from '@/components/access-management/UserAccessTable';

const AccessManagementPage = () => {
  const { userProfile, loading } = useUserRole();

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
          <UserAccessTable />
        </CardContent>
      </Card>
    </div>
  );
};

export default AccessManagementPage;