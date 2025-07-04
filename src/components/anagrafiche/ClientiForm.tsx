import React from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { showSuccess, showError } from "@/utils/toast"; // Import toast utilities
import { supabase } from "@/integrations/supabase/client"; // Import Supabase client
import { Separator } from "@/components/ui/separator";
import { PlusCircle } from "lucide-react";
import { ClientContactFormSection } from "./ClientContactFormSection"; // Import the new component

const contactSchema = z.object({
  department: z.string().min(1, "Il dipartimento è richiesto."),
  contact_name: z.string().optional().nullable(),
  email: z.string().email("Formato email non valido.").optional().nullable().or(z.literal("")),
  phone: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

const formSchema = z.object({
  nome_cliente: z.string().min(2, "La ragione sociale è richiesta."), // Changed to nome_cliente to match DB
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

export function ClientiForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome_cliente: "",
      codice_fiscale: null,
      partita_iva: null,
      indirizzo: null,
      citta: null,
      cap: null,
      provincia: null,
      telefono: null,
      email: null,
      pec: null,
      sdi: null,
      attivo: true,
      note: null,
      contacts: [], // Initialize with an empty array
    },
  });

  const { fields: contactFields, append: appendContact, remove: removeContact } = useFieldArray({
    control: form.control,
    name: "contacts",
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    // Ensure empty strings are converted to null for optional fields
    const clientPayload = {
      nome_cliente: values.nome_cliente,
      partita_iva: values.partita_iva || null,
      codice_fiscale: values.codice_fiscale || null,
      indirizzo: values.indirizzo || null,
      citta: values.citta || null,
      cap: values.cap || null,
      provincia: values.provincia || null,
      telefono: values.telefono || null,
      email: values.email || null,
      pec: values.pec || null,
      sdi: values.sdi || null,
      attivo: values.attivo,
      note: values.note || null,
    };

    const { data: clientData, error: clientError } = await supabase
      .from('clienti')
      .insert([clientPayload])
      .select('id'); // Select the ID of the newly inserted client

    if (clientError) {
      showError(`Errore durante la registrazione del cliente: ${clientError.message}`);
      console.error("Error inserting cliente:", clientError);
      return;
    }

    const newClientId = clientData?.[0]?.id;
    if (!newClientId) {
      showError("Errore: ID cliente non ricevuto dopo la registrazione.");
      return;
    }

    // Handle contacts
    if (values.contacts && values.contacts.length > 0) {
      const contactsPayload = values.contacts.map(contact => ({
        ...contact,
        client_id: newClientId, // Link contact to the new client
        contact_name: contact.contact_name || null,
        email: contact.email || null,
        phone: contact.phone || null,
        notes: contact.notes || null,
      }));

      const { error: contactsError } = await supabase
        .from('client_contacts')
        .insert(contactsPayload);

      if (contactsError) {
        showError(`Errore durante la registrazione dei contatti: ${contactsError.message}`);
        console.error("Error inserting client contacts:", contactsError);
        // Optionally, you might want to delete the client if contacts fail to save
      }
    }

    showSuccess("Cliente e contatti salvati con successo!");
    console.log("Dati Cliente salvati:", clientData);
    form.reset(); // Reset form after successful submission
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <h3 className="text-lg font-semibold">Dettagli Cliente</h3>
        <FormField
          control={form.control}
          name="nome_cliente" // Changed name to match DB
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

        <Button type="submit" className="w-full">Salva Cliente</Button>
      </form>
    </Form>
  );
}