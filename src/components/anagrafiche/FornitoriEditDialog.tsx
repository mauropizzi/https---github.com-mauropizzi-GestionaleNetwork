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
import { Checkbox } from "@/components/ui/checkbox";
import { showSuccess, showError } from "@/utils/toast";
import { supabase } from '@/integrations/supabase/client';
import { Fornitore } from '@/lib/anagrafiche-data';

interface FornitoreEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  fornitore: Fornitore | null;
  onSave: (updatedFornitore: Fornitore) => void;
}

const formSchema = z.object({
  nome_fornitore: z.string().min(2, "La ragione sociale è richiesta."),
  partita_iva: z.string().optional().nullable(),
  codice_fiscale: z.string().optional().nullable(),
  indirizzo: z.string().optional().nullable(),
  cap: z.string().optional().nullable(),
  citta: z.string().min(2, "La città è richiesta.").optional().nullable(), // Made optional for consistency with DB schema, but form requires it
  provincia: z.string().optional().nullable(),
  referente: z.string().optional().nullable(), // Added from DB schema
  telefono: z.string().optional().nullable(),
  email: z.string().email("Formato email non valido.").optional().nullable().or(z.literal("")),
  pec: z.string().email("Formato PEC non valido.").optional().nullable().or(z.literal("")),
  tipo_fornitura: z.enum(["piantonamento", "fiduciario", "entrambi"], {
    required_error: "Seleziona un tipo di servizio.",
  }).optional().nullable().or(z.literal("")),
  attivo: z.boolean().default(true).optional(),
  note: z.string().optional().nullable(),
});

// Define allowed values for tipo_fornitura for safe casting
const allowedTipoFornituraValues = ["piantonamento", "fiduciario", "entrambi", ""] as const;
type AllowedTipoFornitura = typeof allowedTipoFornituraValues[number];

export function FornitoreEditDialog({ isOpen, onClose, fornitore, onSave }: FornitoreEditDialogProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome_fornitore: "",
      partita_iva: null,
      codice_fiscale: null,
      indirizzo: null,
      cap: null,
      citta: null,
      provincia: null,
      referente: null,
      telefono: null,
      email: null,
      pec: null,
      tipo_fornitura: null,
      attivo: true,
      note: null,
    },
  });

  useEffect(() => {
    if (fornitore) {
      // Safely cast tipo_fornitura to the allowed enum values or null
      const safeTipoFornitura: AllowedTipoFornitura | null = 
        (fornitore.tipo_fornitura && allowedTipoFornituraValues.includes(fornitore.tipo_fornitura as AllowedTipoFornitura))
          ? (fornitore.tipo_fornitura as AllowedTipoFornitura)
          : null;

      form.reset({
        nome_fornitore: fornitore.nome_fornitore,
        partita_iva: fornitore.partita_iva || null,
        codice_fiscale: fornitore.codice_fiscale || null,
        indirizzo: fornitore.indirizzo || null,
        citta: fornitore.citta || null,
        provincia: fornitore.provincia || null,
        referente: fornitore.referente || null,
        telefono: fornitore.telefono || null,
        email: fornitore.email || null,
        pec: fornitore.pec || null,
        tipo_fornitura: safeTipoFornitura, // Use the safely casted value
        attivo: fornitore.attivo ?? true,
        note: fornitore.note || null,
      });
    }
  }, [fornitore, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!fornitore) {
      showError("Nessun fornitore selezionato per la modifica.");
      onClose();
      return;
    }

    const updatedData = {
      nome_fornitore: values.nome_fornitore,
      partita_iva: values.partita_iva,
      codice_fiscale: values.codice_fiscale,
      indirizzo: values.indirizzo,
      cap: values.cap,
      citta: values.citta,
      provincia: values.provincia,
      referente: values.referente,
      telefono: values.telefono,
      email: values.email,
      pec: values.pec,
      tipo_fornitura: values.tipo_fornitura,
      attivo: values.attivo,
      note: values.note,
    };

    const { data, error } = await supabase
      .from('fornitori')
      .update(updatedData)
      .eq('id', fornitore.id)
      .select();

    if (error) {
      showError(`Errore durante l'aggiornamento del fornitore: ${error.message}`);
      console.error("Error updating fornitore:", error);
    } else {
      showSuccess(`Fornitore "${fornitore.nome_fornitore}" aggiornato con successo!`);
      onSave({ ...fornitore, ...updatedData });
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifica Fornitore: {fornitore?.nome_fornitore}</DialogTitle>
          <DialogDescription>
            Apporta modifiche ai dettagli del fornitore.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
            <FormField
              control={form.control}
              name="nome_fornitore"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ragione Sociale</FormLabel>
                  <FormControl>
                    <Input placeholder="Ragione Sociale del Fornitore" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                name="referente"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Referente</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome Referente" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>
            <FormField
              control={form.control}
              name="tipo_fornitura"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo di Servizio Fornito</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value === "DYAD_EMPTY_VALUE" ? null : value)}
                    value={field.value || "DYAD_EMPTY_VALUE"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona tipo di servizio" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="DYAD_EMPTY_VALUE">Nessun Tipo Selezionato</SelectItem>
                      <SelectItem value="piantonamento">Piantonamento</SelectItem>
                      <SelectItem value="fiduciario">Fiduciario</SelectItem>
                      <SelectItem value="entrambi">Entrambi</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
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
                      Fornitore Attivo
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
                    <Textarea placeholder="Note sul fornitore..." {...field} value={field.value || ''} />
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