import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { format, parseISO, isValid } from "date-fns"; // Import isValid
import { it } from 'date-fns/locale';

interface ServiceRequest {
  id: string;
  type: string;
  client: string; // Display name
  location: string; // Display name
  startDate: Date;
  endDate: Date;
  status: "Pending" | "Approved" | "Rejected" | "Completed";
  // Add other fields if you want to display them in the details dialog
  startTime?: string;
  endTime?: string;
  numAgents?: number;
  cadenceHours?: number;
  inspectionType?: string;
  dailyHoursConfig?: any;
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
          <DialogTitle>Dettagli Servizio</DialogTitle>
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
            <span className="text-sm font-medium">Punto Servizio:</span>
            <span className="col-span-2 text-sm">{service.location}</span>
          </div>
          <div className="grid grid-cols-3 items-center gap-4">
            <span className="text-sm font-medium">Data Inizio:</span>
            <span className="col-span-2 text-sm">{isValid(service.startDate) ? format(service.startDate, "PPP", { locale: it }) : 'N/A'}</span>
          </div>
          {service.startTime && (
            <div className="grid grid-cols-3 items-center gap-4">
              <span className="text-sm font-medium">Ora Inizio:</span>
              <span className="col-span-2 text-sm">{service.startTime}</span>
            </div>
          )}
          <div className="grid grid-cols-3 items-center gap-4">
            <span className="text-sm font-medium">Data Fine:</span>
            <span className="col-span-2 text-sm">{isValid(service.endDate) ? format(service.endDate, "PPP", { locale: it }) : 'N/A'}</span>
          </div>
          {service.endTime && (
            <div className="grid grid-cols-3 items-center gap-4">
              <span className="text-sm font-medium">Ora Fine:</span>
              <span className="col-span-2 text-sm">{service.endTime}</span>
            </div>
          )}
          <div className="grid grid-cols-3 items-center gap-4">
            <span className="text-sm font-medium">Stato:</span>
            <span className="col-span-2 text-sm">{service.status}</span>
          </div>
          {service.numAgents && (
            <div className="grid grid-cols-3 items-center gap-4">
              <span className="text-sm font-medium">Num. Agenti:</span>
              <span className="col-span-2 text-sm">{service.numAgents}</span>
            </div>
          )}
          {service.cadenceHours && (
            <div className="grid grid-cols-3 items-center gap-4">
              <span className="text-sm font-medium">Cadenza (ore):</span>
              <span className="col-span-2 text-sm">{service.cadenceHours}</span>
            </div>
          )}
          {service.inspectionType && (
            <div className="grid grid-cols-3 items-center gap-4">
              <span className="text-sm font-medium">Tipo Ispezione:</span>
              <span className="col-span-2 text-sm">{service.inspectionType}</span>
            </div>
          )}
          {service.dailyHoursConfig && service.dailyHoursConfig.length > 0 && (
            <div className="grid grid-cols-3 items-start gap-4">
              <span className="text-sm font-medium">Orari Giornalieri:</span>
              <div className="col-span-2 text-sm space-y-1">
                {service.dailyHoursConfig.map((day: any, index: number) => (
                  <p key={index}>
                    {day.day}: {day.is24h ? "H24" : `${day.startTime} - ${day.endTime}`}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}