import React, { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
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
import { Checkbox } from "@/components/ui/checkbox";
import { showSuccess, showError } from "@/utils/toast";
import { supabase } from '@/integrations/supabase/client';
import { Cliente } from '@/lib/anagrafiche-data';
import { Separator } from "@/components/ui/separator";
import { PlusCircle } from "lucide-react";
import { ClientContactFormSection } from "./ClientContactFormSection"; // Import the new component

interface ClientContact {
  id?: string; // Optional for new contacts, present for existing ones
  department: string;
  contact_name?: string | null;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
}

const contactSchema = z.object({
  id: z.string().optional(), // Allow existing contacts to have an ID
  department: z.string().min(1, "Il dipartimento è richiesto."),
  contact_name: z.string().optional().nullable(),
  email: z.string().email("Formato email non valido.").optional().nullable().or(z.literal("")),
  phone: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

const formSchema = z.object({
  nome_cliente: z.string().min(2, "La ragione sociale è richiesta."),
  partita_iva: z.string().optional().nullable(),
  codice_fiscale: z.string().optional().nullable(),
  indirizzo: z.string().optional().nullable(),
  cap: z.string().optional().nullable(),
  citta: z.string().optional().nullable(),
  provincia: z.string().optional().nullable(),
  telefono: z.string().optional().nullable(),
  email: z.string().email("Formato email non valido.").optional().nullable().or(z.literal("")),
  pec: z.string().email("Formato PEC non valido.").optional().nullable().or(z.literal("")),
  sdi: z.string().optional().nullable(),
  attivo: z.boolean().default(true).optional(),
  note: z.string().optional().nullable(),
  contacts: z.array(contactSchema).optional(), // New field for contacts
});

export function ClientiEditDialog({ isOpen, onClose, cliente, onSave }: ClienteEditDialogProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome_cliente: "",
      partita_iva: null,
      codice_fiscale: null,
      indirizzo: null,
      citta: null,
      provincia: null,
      telefono: null,
      email: null,
      pec: null,
      sdi: null,
      attivo: true,
      note: null,
      contacts: [],
    },
  });

  const { fields: contactFields, append: appendContact, remove: removeContact } = useFieldArray({
    control: form.control,
    name: "contacts",
  });

  useEffect(() => {
    const loadContacts = async () => {
      if (cliente) {
        const { data: contactsData, error: contactsError } = await supabase
          .from('client_contacts')
          .select('*')
          .eq('client_id', cliente.id);

        if (contactsError) {
          console.error("Error fetching client contacts:", contactsError);
          showError("Errore nel caricamento dei contatti del cliente.");
          return;
        }

        form.reset({
          nome_cliente: cliente.nome_cliente,
          partita_iva: cliente.partita_iva || null,
          codice_fiscale: cliente.codice_fiscale || null,
          indirizzo: cliente.indirizzo || null,
          citta: cliente.citta || null,
          cap: cliente.cap || null,
          provincia: cliente.provincia || null,
          telefono: cliente.telefono || null,
          email: cliente.email || null,
          pec: cliente.pec || null,
          sdi: cliente.sdi || null,
          attivo: cliente.attivo ?? true,
          note: cliente.note || null,
          contacts: contactsData || [], // Populate contacts
        });
      }
    };
    loadContacts();
  }, [cliente, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!cliente) {
      showError("Nessun cliente selezionato per la modifica.");
      onClose();
      return;
    }

    const updatedClientData = {
      nome_cliente: values.nome_cliente,
      partita_iva: values.partita_iva,
      codice_fiscale: values.codice_fiscale,
      indirizzo: values.indirizzo,
      citta: values.citta,
      cap: values.cap,
      provincia: values.provincia,
      telefono: values.telefono,
      email: values.email,
      pec: values.pec,
      sdi: values.sdi,
      attivo: values.attivo,
      note: values.note,
    };

    const { data: clientUpdateData, error: clientError } = await supabase
      .from('clienti')
      .update(updatedClientData)
      .eq('id', cliente.id)
      .select();

    if (clientError) {
      showError(`Errore durante l'aggiornamento del cliente: ${clientError.message}`);
      console.error("Error updating cliente:", clientError);
      return;
    }

    // Handle contacts: delete existing and insert new/updated ones
    const { error: deleteContactsError } = await supabase
      .from('client_contacts')
      .delete()
      .eq('client_id', cliente.id);

    if (deleteContactsError) {
      showError(`Errore durante l'eliminazione dei vecchi contatti: ${deleteContactsError.message}`);
      console.error("Error deleting old client contacts:", deleteContactsError);
      // Continue anyway, as client data is more critical
    }

    if (values.contacts && values.contacts.length > 0) {
      const contactsPayload = values.contacts.map(contact => ({
        ...contact,
        client_id: cliente.id, // Link contact to the current client
        contact_name: contact.contact_name || null,
        email: contact.email || null,
        phone: contact.phone || null,
        notes: contact.notes || null,
      }));

      const { error: insertContactsError } = await supabase
        .from('client_contacts')
        .insert(contactsPayload);

      if (insertContactsError) {
        showError(`Errore durante l'inserimento dei nuovi contatti: ${insertContactsError.message}`);
        console.error("Error inserting new client contacts:", insertContactsError);
      }
    }

    showSuccess(`Cliente "${cliente.nome_cliente}" e contatti aggiornati con successo!`);
    onSave({ ...cliente, ...updatedClientData });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifica Cliente: {cliente?.nome_cliente}</DialogTitle>
          <DialogDescription>
            Apporta modifiche ai dettagli del cliente.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
            <FormField
              control={form.control}
              name="nome_cliente"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ragione Sociale</FormLabel>
                  <FormControl>
                    <Input placeholder="Ragione Sociale del Cliente" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="codice_fiscale"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Codice Fiscale</FormLabel>
                    <FormControl>
                      <Input placeholder="Codice Fiscale" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="partita_iva"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Partita IVA</FormLabel>
                    <FormControl>
                      <Input placeholder="Partita IVA" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="indirizzo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Indirizzo</FormLabel>
                  <FormControl>
                    <Input placeholder="Via, numero civico" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="citta"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Città</FormLabel>
                    <FormControl>
                      <Input placeholder="Città" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cap"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CAP</FormLabel>
                    <FormControl>
                      <Input placeholder="CAP" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="provincia"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Provincia</FormLabel>
                    <FormControl>
                      <Input placeholder="Provincia" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="telefono"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefono</FormLabel>
                    <FormControl>
                      <Input placeholder="Telefono" {...field} value={field.value || ''} />
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
                      <Input type="email" placeholder="email@example.com" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="pec"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>PEC</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="pec@example.com" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sdi"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Codice SDI</FormLabel>
                    <FormControl>
                      <Input placeholder="Codice SDI" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="attivo"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Cliente Attivo
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Note Aggiuntive</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Note sul cliente..." {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator className="my-8" />

            <h3 className="text-lg font-semibold mb-4">Rubrica Contatti</h3>
            <div className="space-y-4">
              {contactFields.map((item, index) => (
                <ClientContactFormSection key={item.id} index={index} onRemove={removeContact} />
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => appendContact({ department: "", contact_name: "", email: "", phone: "", notes: "" })}
              className="mt-4 w-full"
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Aggiungi Contatto
            </Button>

            <DialogFooter>
              <Button type="submit">Salva Modifiche</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}