import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const PublicSuccessPage = () => {
  return (
    <div className="container mx-auto p-4 flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-md mx-auto text-center">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Successo!</CardTitle>
          <CardDescription>Le modifiche sono state salvate con successo.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">Grazie per aver aggiornato il rapporto.</p>
          <Button onClick={() => window.close()}>Chiudi questa pagina</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default PublicSuccessPage;