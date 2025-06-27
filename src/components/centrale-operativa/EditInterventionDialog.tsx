import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

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
  onSave: (updatedEvent: AllarmeIntervento) => void; // Mantenuto per compatibilità di tipo, non usato
}

export const EditInterventionDialog = ({ isOpen, onClose, event, onSave }: EditInterventionDialogProps) => {
  console.log("EditInterventionDialog: TOP OF COMPONENT. isOpen:", isOpen, "event ID:", event?.id);

  if (!event) {
    console.log("EditInterventionDialog: Not rendering because event is null.");
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifica Evento Allarme: {event.id}</DialogTitle>
          <DialogDescription>
            Questo è un test di apertura del dialog.
          </DialogDescription>
        </DialogHeader>
        <div className="p-4">
          <p>Il dialog si è aperto correttamente con i dati minimi.</p>
          <p>ID Evento: {event.id}</p>
          <p>Data: {event.report_date}</p>
          <p>Ora: {event.report_time}</p>
          <p>Punto Servizio: {event.service_point_code}</p>
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Chiudi</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};