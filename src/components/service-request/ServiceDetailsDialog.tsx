import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { format } from "date-fns";
import { it } from 'date-fns/locale';

interface ServiceRequest {
  id: string;
  type: string;
  client: string;
  location: string;
  startDate: Date;
  endDate: Date;
  status: "Pending" | "Approved" | "Rejected" | "Completed";
  cost?: number;
}

interface ServiceDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  service: ServiceRequest | null;
}

export function ServiceDetailsDialog({ isOpen, onClose, service }: ServiceDetailsDialogProps) {
  if (!service) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Dettagli Servizio: {service.id}</DialogTitle>
          <DialogDescription>
            Informazioni complete sul servizio richiesto.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-3 items-center gap-4">
            <span className="text-sm font-medium">Tipo:</span>
            <span className="col-span-2 text-sm">{service.type}</span>
          </div>
          <div className="grid grid-cols-3 items-center gap-4">
            <span className="text-sm font-medium">Cliente:</span>
            <span className="col-span-2 text-sm">{service.client}</span>
          </div>
          <div className="grid grid-cols-3 items-center gap-4">
            <span className="text-sm font-medium">Località:</span>
            <span className="col-span-2 text-sm">{service.location}</span>
          </div>
          <div className="grid grid-cols-3 items-center gap-4">
            <span className="text-sm font-medium">Data Inizio:</span>
            <span className="col-span-2 text-sm">{format(service.startDate, "PPP", { locale: it })}</span>
          </div>
          <div className="grid grid-cols-3 items-center gap-4">
            <span className="text-sm font-medium">Data Fine:</span>
            <span className="col-span-2 text-sm">{format(service.endDate, "PPP", { locale: it })}</span>
          </div>
          <div className="grid grid-cols-3 items-center gap-4">
            <span className="text-sm font-medium">Stato:</span>
            <span className="col-span-2 text-sm">{service.status}</span>
          </div>
          <div className="grid grid-cols-3 items-center gap-4">
            <span className="text-sm font-medium">Costo Stimato:</span>
            <span className="col-span-2 text-sm">{service.cost !== undefined ? `${service.cost.toFixed(2)} €` : "N/A"}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}