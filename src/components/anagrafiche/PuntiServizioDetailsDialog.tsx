import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { format } from "date-fns";
import { it } from 'date-fns/locale';
import { PuntoServizio } from "@/lib/anagrafiche-data";
import { ExternalLink } from "lucide-react";

interface PuntoServizioDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  puntoServizio: PuntoServizio | null;
}

export function PuntiServizioDetailsDialog({ isOpen, onClose, puntoServizio }: PuntoServizioDetailsDialogProps) {
  if (!puntoServizio) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Dettagli Punto Servizio: {puntoServizio.nome_punto_servizio}</DialogTitle>
          <DialogDescription>
            Informazioni complete sul punto servizio selezionato.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-3 items-center gap-4">
            <span className="text-sm font-medium">Nome Punto Servizio:</span>
            <span className="col-span-2 text-sm">{puntoServizio.nome_punto_servizio}</span>
          </div>
          <div className="grid grid-cols-3 items-center gap-4">
            <span className="text-sm font-medium">Cliente Associato:</span>
            <span className="col-span-2 text-sm">{puntoServizio.nome_cliente || 'N/A'}</span>
          </div>
          <div className="grid grid-cols-3 items-center gap-4">
            <span className="text-sm font-medium">Indirizzo:</span>
            <span className="col-span-2 text-sm">{puntoServizio.indirizzo || 'N/A'}</span>
          </div>
          <div className="grid grid-cols-3 items-center gap-4">
            <span className="text-sm font-medium">Città:</span>
            <span className="col-span-2 text-sm">{puntoServizio.citta || 'N/A'}</span>
          </div>
          <div className="grid grid-cols-3 items-center gap-4">
            <span className="text-sm font-medium">CAP:</span>
            <span className="col-span-2 text-sm">{puntoServizio.cap || 'N/A'}</span>
          </div>
          <div className="grid grid-cols-3 items-center gap-4">
            <span className="text-sm font-medium">Provincia:</span>
            <span className="col-span-2 text-sm">{puntoServizio.provincia || 'N/A'}</span>
          </div>
          <div className="grid grid-cols-3 items-center gap-4">
            <span className="text-sm font-medium">Referente in loco:</span>
            <span className="col-span-2 text-sm">{puntoServizio.referente || 'N/A'}</span>
          </div>
          <div className="grid grid-cols-3 items-center gap-4">
            <span className="text-sm font-medium">Telefono Referente:</span>
            <span className="col-span-2 text-sm">{puntoServizio.telefono_referente || 'N/A'}</span>
          </div>
          <div className="grid grid-cols-3 items-center gap-4">
            <span className="text-sm font-medium">Telefono Punto Servizio:</span>
            <span className="col-span-2 text-sm">{puntoServizio.telefono || 'N/A'}</span>
          </div>
          <div className="grid grid-cols-3 items-center gap-4">
            <span className="text-sm font-medium">Email Punto Servizio:</span>
            <span className="col-span-2 text-sm">{puntoServizio.email || 'N/A'}</span>
          </div>
          <div className="grid grid-cols-3 items-start gap-4">
            <span className="text-sm font-medium">Note:</span>
            <span className="col-span-2 text-sm whitespace-pre-wrap">{puntoServizio.note || 'N/A'}</span>
          </div>
          <div className="grid grid-cols-3 items-center gap-4">
            <span className="text-sm font-medium">Tempo di Intervento (minuti):</span>
            <span className="col-span-2 text-sm">{puntoServizio.tempo_intervento !== undefined && puntoServizio.tempo_intervento !== null ? puntoServizio.tempo_intervento : 'N/A'}</span>
          </div>
          <div className="grid grid-cols-3 items-center gap-4">
            <span className="text-sm font-medium">Fornitore Associato:</span>
            <span className="col-span-2 text-sm">{puntoServizio.nome_fornitore || 'N/A'}</span>
          </div>
          <div className="grid grid-cols-3 items-center gap-4">
            <span className="text-sm font-medium">Codice Cliente Punto:</span>
            <span className="col-span-2 text-sm">{puntoServizio.codice_cliente || 'N/A'}</span>
          </div>
          <div className="grid grid-cols-3 items-center gap-4">
            <span className="text-sm font-medium">Codice SICEP:</span>
            <span className="col-span-2 text-sm">{puntoServizio.codice_sicep || 'N/A'}</span>
          </div>
          <div className="grid grid-cols-3 items-center gap-4">
            <span className="text-sm font-medium">Codice Fatturazione:</span>
            <span className="col-span-2 text-sm">{puntoServizio.codice_fatturazione || 'N/A'}</span>
          </div>
          <div className="grid grid-cols-3 items-center gap-4">
            <span className="text-sm font-medium">Latitudine:</span>
            <span className="col-span-2 text-sm">{puntoServizio.latitude !== undefined && puntoServizio.latitude !== null ? puntoServizio.latitude.toFixed(6) : 'N/A'}</span>
          </div>
          <div className="grid grid-cols-3 items-center gap-4">
            <span className="text-sm font-medium">Longitudine:</span>
            <span className="col-span-2 text-sm">{puntoServizio.longitude !== undefined && puntoServizio.longitude !== null ? puntoServizio.longitude.toFixed(6) : 'N/A'}</span>
          </div>
          <div className="grid grid-cols-3 items-center gap-4">
            <span className="text-sm font-medium">Procedura Associata:</span>
            <span className="col-span-2 text-sm">{puntoServizio.procedure?.nome_procedura || 'N/A'}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}