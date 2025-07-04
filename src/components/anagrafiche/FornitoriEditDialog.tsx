import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { FornitoriForm } from "./FornitoriForm"; // Corrected import
import { Fornitore } from "@/lib/anagrafiche-data";

interface FornitoreEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  fornitore: Fornitore | null;
  onSaveSuccess: () => void; // Added onSaveSuccess prop
}

export function FornitoreEditDialog({ isOpen, onClose, fornitore, onSaveSuccess }: FornitoreEditDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{fornitore ? "Modifica Fornitore" : "Aggiungi Nuovo Fornitore"}</DialogTitle>
          <DialogDescription>
            {fornitore ? "Apporta modifiche ai dettagli del fornitore." : "Compila i campi per aggiungere un nuovo fornitore."}
          </DialogDescription>
        </DialogHeader>
        <FornitoriForm fornitore={fornitore} onSaveSuccess={onSaveSuccess} onCancel={onClose} />
      </DialogContent>
    </Dialog>
  );
}