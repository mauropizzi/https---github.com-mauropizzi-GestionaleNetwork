import React, { useEffect, useState, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { showSuccess, showError, showInfo } from "@/utils/toast";
import { supabase } from '@/integrations/supabase/client';
import { Separator } from "@/components/ui/separator";
import { PlusCircle } from "lucide-react";
import { ClientContactFormSection } from "./ClientContactFormSection";
import { Cliente } from '@/lib/anagrafiche-data'; // Import Cliente interface
import { Form } from "@/components/ui/form"; // Import Form component

interface ClientContact {
  id?: string; // Optional for new contacts, present for existing ones
  department: string;
  contact_name?: string | null;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
}

interface ClientContactsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  cliente: Cliente | null;
}

const contactSchema = z.object({
  id: z.string().optional(),
  department: z.string().min(1, "Il dipartimento è richiesto."),
  contact_name: z.string().optional().nullable(),
  email: z.string().email("Formato email non valido.").optional().nullable().or(z.literal("")),
  phone: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

const formSchema = z.object({
  contacts: z.array(contactSchema).optional(),
});

export function ClientContactsDialog({ isOpen, onClose, cliente }: ClientContactsDialogProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      contacts: [],
    },
  });

  const { fields: contactFields, append: appendContact, remove: removeContact } = useFieldArray({
    control: form.control,
    name: "contacts",
  });

  const [loading, setLoading] = useState(true);

  const fetchContacts = useCallback(async () => {
    if (!cliente?.id) {
      form.setValue('contacts', []); // Corrected: use form.setValue to reset the field array
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data: contactsData, error: contactsError } = await supabase
      .from('client_contacts')
      .select('*')
      .eq('client_id', cliente.id);

    if (contactsError) {
      console.error("Error fetching client contacts:", contactsError);
      showError("Errore nel caricamento dei contatti del cliente.");
      form.setValue('contacts', []); // Corrected: use form.setValue to reset the field array
    } else {
      form.setValue('contacts', contactsData || []); // Corrected: use form.setValue to reset the field array
    }
    setLoading(false);
  }, [cliente, form]); // Added form to dependency array

  useEffect(() => {
    if (isOpen) {
      fetchContacts();
    }
  }, [isOpen, fetchContacts]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!cliente?.id) {
      showError("Nessun cliente selezionato per la gestione dei contatti.");
      onClose();
      return;
    }

    showInfo("Salvataggio contatti in corso...");

    // Delete all existing contacts for this client
    const { error: deleteError } = await supabase
      .from('client_contacts')
      .delete()
      .eq('client_id', cliente.id);

    if (deleteError) {
      showError(`Errore durante l'eliminazione dei vecchi contatti: ${deleteError.message}`);
      console.error("Error deleting old client contacts:", deleteError);
      return;
    }

    // Insert new/updated contacts
    if (values.contacts && values.contacts.length > 0) {
      const contactsPayload = values.contacts.map(contact => ({
        ...contact,
        client_id: cliente.id,
        contact_name: contact.contact_name || null,
        email: contact.email || null,
        phone: contact.phone || null,
        notes: contact.notes || null,
      }));

      const { error: insertError } = await supabase
        .from('client_contacts')
        .insert(contactsPayload);

      if (insertError) {
        showError(`Errore durante l'inserimento dei nuovi contatti: ${insertError.message}`);
        console.error("Error inserting new client contacts:", insertError);
        return;
      }
    }

    showSuccess(`Contatti per "${cliente.nome_cliente}" salvati con successo!`);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Rubrica Contatti: {cliente?.nome_cliente}</DialogTitle>
          <DialogDescription>
            Gestisci i recapiti per i diversi dipartimenti del cliente.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}> {/* Corrected: Form is a context provider */}
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4"> {/* Corrected: actual form element */}
            {loading ? (
              <div className="text-center py-8">Caricamento contatti...</div>
            ) : (
              <div className="space-y-4">
                {contactFields.map((item, index) => (
                  <ClientContactFormSection key={item.id} index={index} onRemove={removeContact} />
                ))}
              </div>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => appendContact({ department: "", contact_name: "", email: "", phone: "", notes: "" })}
              className="mt-4 w-full"
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Aggiungi Contatto
            </Button>

            <DialogFooter>
              <Button type="submit">Salva Contatti</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}