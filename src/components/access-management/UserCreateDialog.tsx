import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { UserCreateForm } from "./UserCreateForm";

interface UserCreateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: () => void;
}

export function UserCreateDialog({ isOpen, onClose, onSaveSuccess }: UserCreateDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crea Nuovo Utente</DialogTitle>
          <DialogDescription>
            Compila i campi per creare un nuovo account utente nel sistema.
          </DialogDescription>
        </DialogHeader>
        <UserCreateForm onSaveSuccess={onSaveSuccess} onCancel={onClose} />
      </DialogContent>
    </Dialog>
  );
}