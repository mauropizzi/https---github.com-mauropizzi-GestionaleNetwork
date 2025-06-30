import React, { useEffect, useState } from 'react';
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
import { PuntoServizio, Cliente, Fornitore } from '@/lib/anagrafiche-data';
import { fetchClienti, fetchFornitori } from '@/lib/data-fetching';

interface PuntoServizioEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  puntoServizio: PuntoServizio | null;
  onSave: (updatedPuntoServizio: PuntoServizio) => void;
}

const formSchema = z.object({
  nome_punto_servizio: z.string().min(2, "Il nome del punto servizio è richiesto."),
  id_cliente: z.string().uuid("Seleziona un cliente valido.").optional().nullable(),
  indirizzo: z.string().min(2, "L'indirizzo è richiesto."),
  citta: z.string().min(2, "La città è richiesta."),
  cap: z.string().optional().nullable(),
  provincia: z.string().optional().nullable(),
  referente: z.string().optional().nullable(),
  telefono_referente: z.string().optional().nullable(),
  telefono: z.string().optional().nullable(),
  email: z.string().email("Formato email non valido.").optional().nullable().or(z.literal("")),
  note: z.string().optional().nullable(),
  tempo_intervento: z.coerce.number().min(0, "Il tempo di intervento deve essere un numero valido.").optional().nullable(),
  fornitore_id: z.string().uuid("Seleziona un fornitore valido.").optional().nullable(),
  codice_cliente: z.string().optional().nullable(),
  codice_sicep: z.string().optional().nullable(),
  codice_fatturazione: z.string().optional().nullable(),
  latitude: z.coerce.number().optional().nullable(),
  longitude: z.coerce.number().optional().nullable(),
});

export function PuntiServizioEditDialog({ isOpen, onClose, puntoServizio, onSave }: PuntoServizioEditDialogProps) {
  const [clienti, setClienti] = useState<Cliente[]>([]);
  const [fornitori, setFornitori] = useState<Fornitore[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome_punto_servizio: "",
      id_cliente: null,
      indirizzo: "",
      citta: "",
      cap: null,
      provincia: null,
      referente: null,
      telefono_referente: null,
      telefono: null,
      email: null,
      note: null,
      tempo_intervento: null,
      fornitore_id: null,
      codice_cliente: null,
      codice_sicep: null,
      codice_fatturazione: null,
      latitude: null,
      longitude: null,
    },
  });

  useEffect(() => {
    const loadData = async () => {
      const fetchedClienti = await fetchClienti();
      const fetchedFornitori = await fetchFornitori();
      setClienti(fetchedClienti);
      setFornitori(fetchedFornitori);
    };
    loadData();
  }, []);

  useEffect(() => {
    if (puntoServizio) {
      form.reset({
        nome_punto_servizio: puntoServizio.nome_punto_servizio,
        id_cliente: puntoServizio.id_cliente || null,
        indirizzo: puntoServizio.indirizzo || "",
        citta: puntoServizio.citta || "",
        cap: puntoServizio.cap || null,
        provincia: puntoServizio.provincia || null,
        referente: puntoServizio.referente || null,
        telefono_referente: puntoServizio.telefono_referente || null,
        telefono: puntoServizio.telefono || null,
        email: puntoServizio.email || null,
        note: puntoServizio.note || null,
        tempo_intervento: puntoServizio.tempo_intervento || null,
        fornitore_id: puntoServizio.fornitore_id || null,
        codice_cliente: puntoServizio.codice_cliente || null,
        codice_sicep: puntoServizio.codice_sicep || null,
        codice_fatturazione: puntoServizio.codice_fatturazione || null,
        latitude: puntoServizio.latitude || null,
        longitude: puntoServizio.longitude || null,
      });
    }
  }, [puntoServizio, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!puntoServizio) {
      showError("Nessun punto servizio selezionato per la modifica.");
      onClose();
      return;
    }

    const updatedData = {
      nome_punto_servizio: values.nome_punto_servizio,
      id_cliente: values.id_cliente,
      indirizzo: values.indirizzo,
      citta: values.citta,
      cap: values.cap,
      provincia: values.provincia,
      referente: values.referente,
      telefono_referente: values.telefono_referente,
      telefono: values.telefono,
      email: values.email,
      note: values.note,
      tempo_intervento: values.tempo_intervento,
      fornitore_id: values.fornitore_id,
      codice_cliente: values.codice_cliente,
      codice_sicep: values.codice_sicep,
      codice_fatturazione: values.codice_fatturazione,
      latitude: values.latitude,
      longitude: values.longitude,
    };

    const { data, error } = await supabase
      .from('punti_servizio')
      .update(updatedData)
      .eq('id', puntoServizio.id)
      .select();

    if (error) {
      showError(`Errore durante l'aggiornamento del punto servizio: ${error.message}`);
      console.error("Error updating punto_servizio:", error);
    } else {
      showSuccess(`Punto servizio "${puntoServizio.nome_punto_servizio}" aggiornato con successo!`);
      onSave({ ...puntoServizio, ...updatedData });
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifica Punto Servizio: {puntoServizio?.nome_punto_servizio}</DialogTitle>
          <DialogDescription>
            Apporta modifiche ai dettagli del punto servizio.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
            <FormField
              control={form.control}
              name="nome_punto_servizio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Punto Servizio</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome Punto Servizio" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="id_cliente"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cliente Associato</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value === "DYAD_EMPTY_VALUE" ? null : value)}
                    value={field.value || "DYAD_EMPTY_VALUE"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona un cliente" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="DYAD_EMPTY_VALUE">Nessun Cliente Associato</SelectItem>
                      {clienti.map((cliente) => (
                        <SelectItem key={cliente.id} value={cliente.id}>
                          {cliente.nome_cliente}
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
              name="indirizzo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Indirizzo</FormLabel>
                  <FormControl>
                    <Input placeholder="Via, numero civico" {...field} />
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
                      <Input placeholder="Città" {...field} />
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
                    <FormLabel>Referente in loco</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome Referente" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="telefono_referente"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefono Referente</FormLabel>
                    <FormControl>
                      <Input placeholder="Telefono Referente" {...field} value={field.value || ''} />
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
                    <FormLabel>Telefono Punto Servizio</FormLabel>
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
                    <FormLabel>Email Punto Servizio</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="email@punto.com" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Note Aggiuntive</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Note aggiuntive sul punto servizio..." {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tempo_intervento"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tempo di Intervento (minuti)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="30" {...field} onChange={e => field.onChange(e.target.valueAsNumber)} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="fornitore_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fornitore Associato (Opzionale)</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value === "DYAD_EMPTY_VALUE" ? null : value)}
                    value={field.value || "DYAD_EMPTY_VALUE"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona un fornitore" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="DYAD_EMPTY_VALUE">Nessun Fornitore</SelectItem>
                      {fornitori.map((fornitore) => (
                        <SelectItem key={fornitore.id} value={fornitore.id}>
                          {fornitore.nome_fornitore}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="codice_cliente"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Codice Cliente Punto</FormLabel>
                    <FormControl>
                      <Input placeholder="Codice Cliente" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="codice_sicep"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Codice SICEP</FormLabel>
                    <FormControl>
                      <Input placeholder="Codice SICEP" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="codice_fatturazione"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Codice Fatturazione</FormLabel>
                    <FormControl>
                      <Input placeholder="Codice Fatturazione" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="latitude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Latitudine</FormLabel>
                    <FormControl>
                      <Input type="number" step="any" placeholder="Es: 38.123456" {...field} onChange={e => field.onChange(e.target.valueAsNumber)} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="longitude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Longitudine</FormLabel>
                    <FormControl>
                      <Input type="number" step="any" placeholder="Es: 13.123456" {...field} onChange={e => field.onChange(e.target.valueAsNumber)} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="submit">Salva Modifiche</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}