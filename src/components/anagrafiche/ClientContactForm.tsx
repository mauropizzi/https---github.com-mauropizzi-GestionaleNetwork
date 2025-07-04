import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Textarea } from "@/components/ui/textarea";
import { showSuccess, showError } from "@/utils/toast";
import { supabase } from "@/integrations/supabase/client";
import { clientContactDepartments } from "@/lib/client-data";
import { ClientContact } from "@/lib/anagrafiche-data";

const formSchema = z.object({
  department: z.string().min(1, "Il dipartimento è richiesto."),
  contact_name: z.string().optional().nullable(),
  email: z.string().email("Formato email non valido.").optional().nullable().or(z.literal("")),
  phone: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

interface ClientContactFormProps {
  clientId: string;
  contact?: ClientContact | null; // For editing existing contact
  onSaveSuccess: () => void;
  onCancel?: () => void;
}

export function ClientContactForm({ clientId, contact, onSaveSuccess, onCancel }: ClientContactFormProps) {
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
      form.reset(); // Reset for new contact if no 'contact' prop
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
      showError(`Errore durante la ${contact?.id ? 'modifica' : 'registrazione'} del contatto: ${result.error.message}`);
      console.error(`Error ${contact?.id ? 'updating' : 'inserting'} client contact:`, result.error);
    } else {
      showSuccess(`Contatto ${contact?.id ? 'modificato' : 'salvato'} con successo!`);
      form.reset();
      onSaveSuccess();
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <h3 className="text-lg font-semibold">{contact ? "Modifica Contatto" : "Nuovo Contatto"}</h3>
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
        <div className="flex justify-end gap-2 mt-6">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Annulla
            </Button>
          )}
          <Button type="submit" className="w-full">
            {contact ? "Salva Modifiche" : "Aggiungi Contatto"}
          </Button>
        </div>
      </form>
    </Form>
  );
}