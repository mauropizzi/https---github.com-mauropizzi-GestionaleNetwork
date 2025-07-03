import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { format, parseISO, isValid } from "date-fns";
import { it } from 'date-fns/locale';
import { RichiestaManutenzione } from "@/lib/anagrafiche-data";

interface MaintenanceRequestDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  request: RichiestaManutenzione | null;
}

export function MaintenanceRequestDetailsDialog({ isOpen, onClose, request }: MaintenanceRequestDetailsDialogProps) {
  if (!request) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Dettagli Richiesta Manutenzione: {request.vehicle_plate}</DialogTitle>
          <DialogDescription>
            Informazioni complete sulla richiesta di manutenzione.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-3 items-center gap-4">
            <span className="text-sm font-medium">ID Richiesta:</span>
            <span className="col-span-2 text-sm">{request.id}</span>
          </div>
          <div className="grid grid-cols-3 items-center gap-4">
            <span className="text-sm font-medium">Data Richiesta:</span>
            <span className="col-span-2 text-sm">
              {isValid(parseISO(request.requested_at)) ? format(parseISO(request.requested_at), "PPP HH:mm", { locale: it }) : 'N/A'}
            </span>
          </div>
          <div className="grid grid-cols-3 items-center gap-4">
            <span className="text-sm font-medium">Punto Servizio:</span>
            <span className="col-span-2 text-sm">{request.service_point?.nome_punto_servizio || 'N/A'}</span>
          </div>
          <div className="grid grid-cols-3 items-center gap-4">
            <span className="text-sm font-medium">Targa Veicolo:</span>
            <span className="col-span-2 text-sm">{request.vehicle_plate || 'N/A'}</span>
          </div>
          <div className="grid grid-cols-3 items-start gap-4">
            <span className="text-sm font-medium">Descrizione Problema:</span>
            <span className="col-span-2 text-sm whitespace-pre-wrap">{request.issue_description || 'N/A'}</span>
          </div>
          <div className="grid grid-cols-3 items-center gap-4">
            <span className="text-sm font-medium">Stato:</span>
            <span className="col-span-2 text-sm">{request.status || 'N/A'}</span>
          </div>
          <div className="grid grid-cols-3 items-center gap-4">
            <span className="text-sm font-medium">Priorità:</span>
            <span className="col-span-2 text-sm">{request.priority || 'N/A'}</span>
          </div>
          <div className="grid grid-cols-3 items-center gap-4">
            <span className="text-sm font-medium">Richiesto da:</span>
            <span className="col-span-2 text-sm">
              {request.requested_by_employee ? `${request.requested_by_employee.nome} ${request.requested_by_employee.cognome}` : 'N/A'}
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}