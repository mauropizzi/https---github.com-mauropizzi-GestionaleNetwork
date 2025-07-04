import React from 'react';
import { useParams } from 'react-router-dom'; // Assuming react-router-dom for useParams
import { ServiceReportForm } from '@/components/dotazioni-di-servizio/ServiceReportForm'; // Changed to named import

export default function EditServiceReportPage() {
  const { id } = useParams<{ id: string }>(); // Get ID from URL

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Modifica Rapporto di Servizio {id ? `(ID: ${id})` : ''}</h1>
      {/* You would typically fetch the report data using the ID and pass it to the form */}
      <ServiceReportForm reportId={id} /> {/* Pass reportId to the form */}
    </div>
  );
}