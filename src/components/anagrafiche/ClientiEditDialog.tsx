import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ClienteForm } from "./ClienteForm";
import { Cliente } from "@/lib/anagrafiche-data";

interface ClienteEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  cliente: Cliente | null;
  onSaveSuccess: () => void;
}

export function ClienteEditDialog({ isOpen, onClose, cliente, onSaveSuccess }: ClienteEditDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{cliente ? "Modifica Cliente" : "Aggiungi Nuovo Cliente"}</DialogTitle>
          <DialogDescription>
            {cliente ? "Apporta modifiche ai dettagli del cliente." : "Compila i campi per aggiungere un nuovo cliente."}
          </DialogDescription>
        </DialogHeader>
        <ClienteForm cliente={cliente} onSaveSuccess={onSaveSuccess} onCancel={onClose} />
      </DialogContent>
    </Dialog>
  );
}