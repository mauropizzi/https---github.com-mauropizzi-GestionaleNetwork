import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { PuntoServizio } from "@/lib/anagrafiche-data";
import { Separator } from "@/components/ui/separator";

interface PuntoServizioExtended extends PuntoServizio {
  fornitori?: { nome_fornitore: string }[];
  procedure?: { nome_procedura: string }[];
}

interface PuntoServizioDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  puntoServizio: PuntoServizioExtended | null;
}

export function PuntoServizioDetailsDialog({ isOpen, onClose, puntoServizio }: PuntoServizioDetailsDialogProps) {
  if (!puntoServizio) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Dettagli Punto di Servizio</DialogTitle>
          <DialogDescription>
            Visualizza le informazioni complete per il punto di servizio selezionato.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <p className="text-sm font-medium col-span-1">Nome:</p>
            <p className="text-sm col-span-3">{puntoServizio.nome_punto_servizio}</p>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <p className="text-sm font-medium col-span-1">Indirizzo:</p>
            <p className="text-sm col-span-3">{puntoServizio.address || 'N/A'}</p>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <p className="text-sm font-medium col-span-1">Città:</p>
            <p className="text-sm col-span-3">{puntoServizio.city || 'N/A'}</p>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <p className="text-sm font-medium col-span-1">CAP:</p>
            <p className="text-sm col-span-3">{puntoServizio.zip_code || 'N/A'}</p>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <p className="text-sm font-medium col-span-1">Provincia:</p>
            <p className="text-sm col-span-3">{puntoServizio.province || 'N/A'}</p>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <p className="text-sm font-medium col-span-1">Nazione:</p>
            <p className="text-sm col-span-3">{puntoServizio.country || 'N/A'}</p>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <p className="text-sm font-medium col-span-1">Telefono:</p>
            <p className="text-sm col-span-3">{puntoServizio.phone || 'N/A'}</p>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <p className="text-sm font-medium col-span-1">Email:</p>
            <p className="text-sm col-span-3">{puntoServizio.email || 'N/A'}</p>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <p className="text-sm font-medium col-span-1">Fornitore:</p>
            <p className="text-sm col-span-3">{puntoServizio.fornitori?.[0]?.nome_fornitore || 'N/A'}</p>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <p className="text-sm font-medium col-span-1">Tipo Servizio:</p>
            <p className="text-sm col-span-3">{puntoServizio.service_type || 'N/A'}</p>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <p className="text-sm font-medium col-span-1">Note:</p>
            <p className="text-sm col-span-3">{puntoServizio.notes || 'N/A'}</p>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <p className="text-sm font-medium col-span-1">Procedura:</p>
            <p className="text-sm col-span-3">{puntoServizio.procedure?.[0]?.nome_procedura || 'N/A'}</p>
          </div>
          <Separator className="my-2" />
          <div className="grid grid-cols-4 items-center gap-4">
            <p className="text-sm font-medium col-span-1">Data Creazione:</p>
            <p className="text-sm col-span-3">{new Date(puntoServizio.created_at).toLocaleDateString()}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}