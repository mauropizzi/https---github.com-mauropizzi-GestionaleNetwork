import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ProcedureTable } from "@/components/anagrafiche/ProcedureTable";

interface CantiereProceduresDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CantiereProceduresDialog({ isOpen, onClose }: CantiereProceduresDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Procedure per Cantieri</DialogTitle>
          <DialogDescription>
            Visualizza le procedure associate ai registri di cantiere.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-hidden py-4">
          <ProcedureTable initialSearchTerm="cantiere" />
        </div>
      </DialogContent>
    </Dialog>
  );
}