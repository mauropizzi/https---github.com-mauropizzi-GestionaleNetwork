import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Fornitore } from "@/lib/anagrafiche-data";
import { FornitoriEditForm } from "./FornitoriEditForm"; // Import the new edit form

interface FornitoreEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  fornitore: Fornitore | null;
  onSaveSuccess: (updatedFornitore: Fornitore) => void; // Changed signature to pass updated fornitore
}

export function FornitoreEditDialog({ isOpen, onClose, fornitore, onSaveSuccess }: FornitoreEditDialogProps) {
  if (!fornitore) return null; // Render nothing if no fornitore is provided

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifica Fornitore</DialogTitle>
          <DialogDescription>
            Apporta modifiche ai dettagli del fornitore.
          </DialogDescription>
        </DialogHeader>
        <FornitoriEditForm fornitore={fornitore} onSaveSuccess={onSaveSuccess} onCancel={onClose} />
      </DialogContent>
    </Dialog>
  );
}