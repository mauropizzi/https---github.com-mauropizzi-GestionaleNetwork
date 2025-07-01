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
import { Checkbox } from "@/components/ui/checkbox";
import { showSuccess, showError } from "@/utils/toast";
import { supabase } from '@/integrations/supabase/client';
import { Cliente } from '@/lib/anagrafiche-data';

interface ClienteEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  cliente: Cliente | null;
  onSave: (updatedCliente: Cliente) => void;
}

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
});

export function ClientiEditDialog({ isOpen, onClose, cliente, onSave }: ClienteEditDialogProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome_cliente: "",
      partita_iva: null,
      codice_fiscale: null,
      indirizzo: null,
      cap: null,
      citta: null,
      provincia: null,
      telefono: null,
      email: null,
      pec: null,
      sdi: null,
      attivo: true,
      note: null,
    },
  });

  useEffect(() => {
    if (cliente) {
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
      });
    }
  }, [cliente, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!cliente) {
      showError("Nessun cliente selezionato per la modifica.");
      onClose();
      return;
    }

    const updatedData = {
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

    const { data, error } = await supabase
      .from('clienti')
      .update(updatedData)
      .eq('id', cliente.id)
      .select();

    if (error) {
      showError(`Errore durante l'aggiornamento del cliente: ${error.message}`);
      console.error("Error updating cliente:", error);
    } else {
      showSuccess(`Cliente "${cliente.nome_cliente}" aggiornato con successo!`);
      onSave({ ...cliente, ...updatedData });
    }
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
            <DialogFooter>
              <Button type="submit">Salva Modifiche</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}