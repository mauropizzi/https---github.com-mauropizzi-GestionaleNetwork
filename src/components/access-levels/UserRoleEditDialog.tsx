import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { showSuccess, showError } from "@/utils/toast";
import { supabase } from '@/integrations/supabase/client';
import { UserProfile } from '@/lib/anagrafiche-data';

interface UserRoleEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  onSave: (updatedUser: UserProfile) => void;
}

const roleOptions = ["admin", "editor", "user"]; // Define available roles

const formSchema = z.object({
  role: z.enum(["admin", "editor", "user"], {
    required_error: "Il ruolo è richiesto.",
  }),
});

export function UserRoleEditDialog({ isOpen, onClose, user, onSave }: UserRoleEditDialogProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      role: "user",
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        role: (user.role as "admin" | "editor" | "user") || "user",
      });
    }
  }, [user, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) {
      showError("Nessun utente selezionato per la modifica del ruolo.");
      onClose();
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .update({ role: values.role })
      .eq('id', user.id);

    if (error) {
      showError(`Errore durante l'aggiornamento del ruolo: ${error.message}`);
      console.error("Error updating user role:", error);
    } else {
      showSuccess(`Ruolo per ${user.email} aggiornato a "${values.role}" con successo!`);
      onSave({ ...user, role: values.role });
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Modifica Ruolo Utente: {user?.email}</DialogTitle>
          <DialogDescription>
            Seleziona il nuovo ruolo per questo utente.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ruolo</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona un ruolo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {roleOptions.map((role) => (
                        <SelectItem key={role} value={role}>
                          {role.charAt(0).toUpperCase() + role.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">Salva Modifiche</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}