import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { format } from "date-fns";
import { it } from 'date-fns/locale';
import { Procedure } from "@/lib/anagrafiche-data";
import { ExternalLink } from "lucide-react";

interface ProcedureDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  procedure: Procedure | null;
}

export function ProcedureDetailsDialog({ isOpen, onClose, procedure }: ProcedureDetailsDialogProps) {
  if (!procedure) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Dettagli Procedura: {procedure.nome_procedura}</DialogTitle>
          <DialogDescription>
            Informazioni complete sulla procedura selezionata.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-3 items-center gap-4">
            <span className="text-sm font-medium">Nome Procedura:</span>
            <span className="col-span-2 text-sm">{procedure.nome_procedura}</span>
          </div>
          <div className="grid grid-cols-3 items-start gap-4">
            <span className="text-sm font-medium">Descrizione:</span>
            <span className="col-span-2 text-sm whitespace-pre-wrap">{procedure.descrizione || 'N/A'}</span>
          </div>
          <div className="grid grid-cols-3 items-center gap-4">
            <span className="text-sm font-medium">Versione:</span>
            <span className="col-span-2 text-sm">{procedure.versione || 'N/A'}</span>
          </div>
          <div className="grid grid-cols-3 items-center gap-4">
            <span className="text-sm font-medium">Ultima Revisione:</span>
            <span className="col-span-2 text-sm">
              {procedure.data_ultima_revisione ? format(new Date(procedure.data_ultima_revisione), "PPP", { locale: it }) : 'N/A'}
            </span>
          </div>
          <div className="grid grid-cols-3 items-center gap-4">
            <span className="text-sm font-medium">Responsabile:</span>
            <span className="col-span-2 text-sm">{procedure.responsabile || 'N/A'}</span>
          </div>
          <div className="grid grid-cols-3 items-center gap-4">
            <span className="text-sm font-medium">URL Documento:</span>
            <span className="col-span-2 text-sm">
              {procedure.documento_url ? (
                <a href={procedure.documento_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center">
                  Visualizza Documento <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              ) : 'N/A'}
            </span>
          </div>
          <div className="grid grid-cols-3 items-center gap-4">
            <span className="text-sm font-medium">Attiva:</span>
            <span className="col-span-2 text-sm">{procedure.attivo ? 'Sì' : 'No'}</span>
          </div>
          <div className="grid grid-cols-3 items-start gap-4">
            <span className="text-sm font-medium">Note:</span>
            <span className="col-span-2 text-sm whitespace-pre-wrap">{procedure.note || 'N/A'}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}