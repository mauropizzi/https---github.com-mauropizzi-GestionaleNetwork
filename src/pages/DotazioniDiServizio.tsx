import React from 'react';
import { ServiceReportForm } from '@/components/dotazioni-di-servizio/ServiceReportForm'; // Changed to named import

export default function DotazioniDiServizioPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Gestione Dotazioni di Servizio</h1>
      <ServiceReportForm />
    </div>
  );
}