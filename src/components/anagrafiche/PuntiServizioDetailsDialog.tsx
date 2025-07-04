import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { PuntoServizio } from "@/lib/anagrafiche-data";
import { Separator } from "@/components/ui/separator";

interface PuntoServizioExtended extends PuntoServizio {
  fornitori?: { nome_fornitore: string } | null;
  procedure?: { nome_procedura: string } | null;
  clienti?: { nome_cliente: string } | null;
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
            <p className="text-sm col-span-3">{puntoServizio.indirizzo || 'N/A'}</p>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <p className="text-sm font-medium col-span-1">Città:</p>
            <p className="text-sm col-span-3">{puntoServizio.citta || 'N/A'}</p>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <p className="text-sm font-medium col-span-1">CAP:</p>
            <p className="text-sm col-span-3">{puntoServizio.cap || 'N/A'}</p>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <p className="text-sm font-medium col-span-1">Provincia:</p>
            <p className="text-sm col-span-3">{puntoServizio.provincia || 'N/A'}</p>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <p className="text-sm font-medium col-span-1">Telefono:</p>
            <p className="text-sm col-span-3">{puntoServizio.telefono || 'N/A'}</p>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <p className="text-sm font-medium col-span-1">Email:</p>
            <p className="text-sm col-span-3">{puntoServizio.email || 'N/A'}</p>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <p className="text-sm font-medium col-span-1">Fornitore:</p>
            <p className="text-sm col-span-3">{puntoServizio.fornitori?.nome_fornitore || 'N/A'}</p>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <p className="text-sm font-medium col-span-1">Note:</p>
            <p className="text-sm col-span-3">{puntoServizio.note || 'N/A'}</p>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <p className="text-sm font-medium col-span-1">Procedura:</p>
            <p className="text-sm col-span-3">{puntoServizio.procedure?.nome_procedura || 'N/A'}</p>
          </div>
          <Separator className="my-2" />
          <div className="grid grid-cols-4 items-center gap-4">
            <p className="text-sm font-medium col-span-1">Data Creazione:</p>
            <p className="text-sm col-span-3">{new Date(puntoServizio.created_at || '').toLocaleDateString()}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}