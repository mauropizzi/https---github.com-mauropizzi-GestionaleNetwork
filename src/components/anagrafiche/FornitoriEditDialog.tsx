import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { Fornitore } from "@/lib/anagrafiche-data"; // Assuming Fornitore type is defined here

const formSchema = z.object({
  nome: z.string().min(1, "Il nome è richiesto."),
  partita_iva: z.string().optional().nullable(),
  codice_fiscale: z.string().optional().nullable(),
  indirizzo: z.string().optional().nullable(),
  citta: z.string().optional().nullable(),
  cap: z.string().optional().nullable(),
  provincia: z.string().optional().nullable(),
  telefono: z.string().optional().nullable(),
  email: z.string().email("Email non valida.").optional().nullable(),
  pec: z.string().email("PEC non valida.").optional().nullable(),
  sdi: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
  attivo: z.boolean().default(true),
  // Ensure this enum matches the database and UI expectations
  tipo_servizio: z.enum(["", "piantonamento", "fiduciario", "entrambi"]).default(""),
});

interface FornitoriEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  fornitore?: Fornitore | null;
  onSaveSuccess: () => void;
}

export function FornitoriEditDialog({
  isOpen,
  onClose,
  fornitore,
  onSaveSuccess,
}: FornitoriEditDialogProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
      partita_iva: "",
      codice_fiscale: "",
      indirizzo: "",
      citta: "",
      cap: "",
      provincia: "",
      telefono: "",
      email: "",
      pec: "",
      sdi: "",
      note: "",
      attivo: true,
      tipo_servizio: "", // Default to empty string
    },
  });

  useEffect(() => {
    if (fornitore) {
      form.reset({
        nome: fornitore.nome || "",
        partita_iva: fornitore.partita_iva || "",
        codice_fiscale: fornitore.codice_fiscale || "",
        indirizzo: fornitore.indirizzo || "",
        citta: fornitore.citta || "",
        cap: fornitore.cap || "",
        provincia: fornitore.provincia || "",
        telefono: fornitore.telefono || "",
        email: fornitore.email || "",
        pec: fornitore.pec || "",
        sdi: fornitore.sdi || "", // Access 'sdi'
        note: fornitore.note || "",
        attivo: fornitore.attivo ?? true,
        // Ensure the fetched value is one of the valid enum options, or default to ""
        tipo_servizio: (fornitore.tipo_servizio as "" | "piantonamento" | "fiduciario" | "entrambi") || "", // Access 'tipo_servizio'
      });
    } else {
      form.reset();
    }
  }, [fornitore, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const payload = {
      ...values,
      // Ensure empty strings are converted to null for optional fields if DB expects null
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
      note: values.note || null,
      tipo_servizio: values.tipo_servizio || null, // Store empty string as null if appropriate for DB
    };

    if (fornitore) {
      // Update existing fornitore
      const { error } = await supabase
        .from("fornitori")
        .update(payload)
        .eq("id", fornitore.id);

      if (error) {
        showError(`Errore durante l'aggiornamento del fornitore: ${error.message}`);
      } else {
        showSuccess("Fornitore aggiornato con successo!");
        onSaveSuccess();
        onClose();
      }
    } else {
      // Add new fornitore
      const { error } = await supabase.from("fornitori").insert(payload);

      if (error) {
        showError(`Errore durante l'aggiunta del fornitore: ${error.message}`);
      } else {
        showSuccess("Fornitore aggiunto con successo!");
        onSaveSuccess();
        onClose();
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{fornitore ? "Modifica Fornitore" : "Aggiungi Nuovo Fornitore"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input {...field} />
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
                    <Input {...field} value={field.value || ''} />
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
                    <Input {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="indirizzo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Indirizzo</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ''} />
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
                      <Input {...field} value={field.value || ''} />
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
                      <Input {...field} value={field.value || ''} />
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
                      <Input {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="telefono"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefono</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ''} />
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
                    <Input type="email" {...field} value={field.value || ''} />
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
                    <Input type="email" {...field} value={field.value || ''} />
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
                    <Input {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tipo_servizio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo di Servizio</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona il tipo di servizio" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">Nessuno</SelectItem>
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
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Note</FormLabel>
                  <FormControl>
                    <Textarea {...field} value={field.value || ''} />
                  </FormControl>
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
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Attivo</FormLabel>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Annulla
              </Button>
              <Button type="submit">Salva</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}