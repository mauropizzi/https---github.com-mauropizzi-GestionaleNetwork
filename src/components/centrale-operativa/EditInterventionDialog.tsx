import React from 'react';
// Rimosse le importazioni di shadcn/ui Dialog e Button per un test minimale
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
// import { Button } from "@/components/ui/button";

interface AllarmeIntervento {
  id: string;
  report_date: string;
  report_time: string;
  service_point_code: string;
  request_type: string;
  co_operator?: string;
  operator_client?: string;
  gpg_intervention?: string;
  service_outcome?: string;
  notes?: string;
  latitude?: number;
  longitude?: number;
}

interface EditInterventionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  event: AllarmeIntervento | null;
  onSave: (updatedEvent: AllarmeIntervento) => void;
}

export const EditInterventionDialog = ({ isOpen, onClose, event, onSave }: EditInterventionDialogProps) => {
  console.log("EditInterventionDialog: TOP OF COMPONENT. isOpen:", isOpen, "event ID:", event?.id);

  if (!isOpen || !event) {
    console.log("EditInterventionDialog: Not rendering because isOpen is false or event is null.");
    return null;
  }

  console.log("EditInterventionDialog: Event is not null and isOpen is true, proceeding to render simple div.");

  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      backgroundColor: 'white',
      padding: '20px',
      border: '2px solid red',
      zIndex: 1000,
      boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
    }}>
      <h2>Minimal Dialog Test</h2>
      <p>Questo è un test. Il dialog dovrebbe aprirsi correttamente.</p>
      <p>ID Evento: {event.id}</p>
      <p>Data: {event.report_date}</p>
      <p>Ora: {event.report_time}</p>
      <p>Punto Servizio: {event.service_point_code}</p>
      <button onClick={onClose} style={{ marginTop: '10px', padding: '8px 16px', cursor: 'pointer' }}>
        Chiudi Minimal Dialog
      </button>
    </div>
  );
};