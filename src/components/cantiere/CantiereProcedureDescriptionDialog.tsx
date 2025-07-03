import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Procedure } from "@/lib/anagrafiche-data";

interface CantiereProcedureDescriptionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  procedure: Procedure | null;
}

export function CantiereProcedureDescriptionDialog({ isOpen, onClose, procedure }: CantiereProcedureDescriptionDialogProps) {
  if (!procedure) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Descrizione Procedura: {procedure.nome_procedura}</DialogTitle>
          <DialogDescription>
            Dettagli della procedura selezionata.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <h4 className="font-semibold mb-2">Descrizione:</h4>
          <p className="text-sm whitespace-pre-wrap">{procedure.descrizione || 'Nessuna descrizione disponibile.'}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}