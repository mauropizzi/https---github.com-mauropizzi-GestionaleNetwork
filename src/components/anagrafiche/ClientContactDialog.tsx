import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { clientContactDepartments } from '@/lib/client-data';

interface ClientContact {
  id?: string; // Optional for new contacts, present for existing ones
  client_id: string;
  department: string;
  contact_name?: string | null;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
}

interface ClientContactDialogProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  contact: ClientContact | null; // Null for new, object for edit
  onSave: () => void;
}

const formSchema = z.object({
  department: z.string().min(1, "Il dipartimento è richiesto."),
  contact_name: z.string().optional().nullable(),
  email: z.string().email("Formato email non valido.").optional().nullable().or(z.literal("")),
  phone: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export function ClientContactDialog({ isOpen, onClose, clientId, contact, onSave }: ClientContactDialogProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      department: "",
      contact_name: null,
      email: null,
      phone: null,
      notes: null,
    },
  });

  useEffect(() => {
    if (contact) {
      form.reset({
        department: contact.department,
        contact_name: contact.contact_name || null,
        email: contact.email || null,
        phone: contact.phone || null,
        notes: contact.notes || null,
      });
    } else {
      form.reset(); // Reset for new contact
    }
  }, [contact, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const payload = {
      client_id: clientId,
      department: values.department,
      contact_name: values.contact_name || null,
      email: values.email || null,
      phone: values.phone || null,
      notes: values.notes || null,
    };

    let result;
    if (contact?.id) {
      // Update existing contact
      result = await supabase
        .from('client_contacts')
        .update(payload)
        .eq('id', contact.id);
    } else {
      // Insert new contact
      result = await supabase
        .from('client_contacts')
        .insert([payload]);
    }

    if (result.error) {
      showError(`Errore durante il salvataggio del contatto: ${result.error.message}`);
      console.error("Error saving client contact:", result.error);
    } else {
      showSuccess(`Contatto salvato con successo!`);
      onSave(); // Trigger refresh in parent
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{contact ? "Modifica Contatto" : "Aggiungi Nuovo Contatto"}</DialogTitle>
          <DialogDescription>
            {contact ? "Apporta modifiche ai dettagli del contatto." : "Compila i campi per aggiungere un nuovo contatto."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
            <FormField
              control={form.control}
              name="department"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dipartimento</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona dipartimento" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {clientContactDepartments.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="contact_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Contatto</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome del referente" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="email@esempio.com" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefono</FormLabel>
                  <FormControl>
                    <Input placeholder="Numero di telefono" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Note</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Note aggiuntive sul contatto..." rows={3} {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">Salva Contatto</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}