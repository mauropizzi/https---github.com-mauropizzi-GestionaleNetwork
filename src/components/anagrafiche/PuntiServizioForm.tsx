import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { useAnagraficheData } from "@/hooks/use-anagrafiche-data"; // Import the new hook
import { showError, showSuccess } from "@/utils/toast";
import { supabase } from "@/integrations/supabase/client";

const formSchema = z.object({
  nomePuntoServizio: z.string().min(2, "Il nome del punto servizio è richiesto."),
  idCliente: z.string().uuid("Seleziona un cliente valido.").nonempty("Seleziona un cliente."),
  indirizzo: z.string().min(2, "L'indirizzo è richiesto."),
  citta: z.string().min(2, "La città è richiesto."),
  cap: z.string().optional(),
  provincia: z.string().optional(),
  referente: z.string().optional(),
  telefonoReferente: z.string().optional(),
  telefono: z.string().optional(),
  email: z.string().email("Formato email non valido.").optional().or(z.literal("")),
  note: z.string().optional(),
  tempoIntervento: z.coerce.number().min(0, "Il tempo di intervento deve essere un numero valido.").optional(),
  fornitoreId: z.string().uuid("Seleziona un fornitore valido.").optional().or(z.literal("")),
  codiceCliente: z.string().optional(),
  codiceSicep: z.string().optional(),
  codiceFatturazione: z.string().optional(),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  procedureId: z.string().uuid("Seleziona una procedura valida.").optional().or(z.literal("")), // Nuovo campo
});

export function PuntiServizioForm() {
  const { clienti, fornitori, procedure: procedureList, loading } = useAnagraficheData(); // Use the hook

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nomePuntoServizio: "",
      idCliente: "",
      indirizzo: "",
      citta: "",
      cap: "",
      provincia: "",
      referente: "",
      telefonoReferente: "",
      telefono: "",
      email: "",
      note: "",
      tempoIntervento: undefined,
      fornitoreId: "",
      codiceCliente: "",
      codiceSicep: "",
      codiceFatturazione: "",
      latitude: undefined,
      longitude: undefined,
      procedureId: "", // Default per nuovo campo
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const payload = {
      nome_punto_servizio: values.nomePuntoServizio,
      id_cliente: values.idCliente || null,
      indirizzo: values.indirizzo,
      citta: values.citta,
      cap: values.cap || null,
      provincia: values.provincia || null,
      referente: values.referente || null,
      telefono_referente: values.telefonoReferente || null,
      telefono: values.telefono || null,
      email: values.email || null,
      note: values.note || null,
      tempo_intervento: values.tempoIntervento || null,
      fornitore_id: values.fornitoreId || null,
      codice_cliente: values.codiceCliente || null,
      codice_sicep: values.codiceSicep || null,
      codice_fatturazione: values.codiceFatturazione || null,
      latitude: values.latitude || null,
      longitude: values.longitude || null,
      procedure_id: values.procedureId || null,
    };

    const { data, error } = await supabase
      .from('punti_servizio')
      .insert([payload])
      .select();

    if (error) {
      showError(`Errore durante la registrazione del punto servizio: ${error.message}`);
      console.error("Error inserting punto_servizio:", error);
    } else {
      showSuccess("Punto servizio salvato con successo!");
      console.log("Dati Punto Servizio salvati:", data);
      form.reset();
    }
  };

  if (loading) {
    return <div>Caricamento dati anagrafici...</div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <h3 className="text-lg font-semibold">Dettagli Punto Servizio</h3>
        <FormField
          control={form.control}
          name="nomePuntoServizio"
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
          name="idCliente"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cliente Associato</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(value === "DYAD_EMPTY_VALUE" ? "" : value)}
                value={field.value || "DYAD_EMPTY_VALUE"}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona un cliente" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="DYAD_EMPTY_VALUE">Seleziona un cliente</SelectItem>
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
                  <Input placeholder="CAP" {...field} />
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
                  <Input placeholder="Provincia" {...field} />
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
                  <Input placeholder="Nome Referente" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="telefonoReferente"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefono Referente</FormLabel>
                <FormControl>
                  <Input placeholder="Telefono Referente" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        {/* Nuovi campi aggiunti */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="telefono"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefono Punto Servizio</FormLabel>
                <FormControl>
                  <Input placeholder="Telefono" {...field} />
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
                  <Input type="email" placeholder="email@punto.com" {...field} />
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
                <Textarea placeholder="Note aggiuntive sul punto servizio..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="tempoIntervento"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tempo di Intervento (minuti)</FormLabel>
              <FormControl>
                <Input type="number" placeholder="30" {...field} onChange={e => field.onChange(e.target.valueAsNumber)} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="fornitoreId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fornitore Associato (Opzionale)</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(value === "DYAD_EMPTY_VALUE" ? "" : value)}
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
            name="codiceCliente"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Codice Cliente Punto</FormLabel>
                <FormControl>
                  <Input placeholder="Codice Cliente" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="codiceSicep"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Codice SICEP</FormLabel>
                <FormControl>
                  <Input placeholder="Codice SICEP" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="codiceFatturazione"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Codice Fatturazione</FormLabel>
                <FormControl>
                  <Input placeholder="Codice Fatturazione" {...field} />
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
                  <Input type="number" step="any" placeholder="Es: 38.123456" {...field} onChange={e => field.onChange(e.target.valueAsNumber)} />
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
                  <Input type="number" step="any" placeholder="Es: 13.123456" {...field} onChange={e => field.onChange(e.target.valueAsNumber)} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        {/* Nuovo campo per la procedura */}
        <FormField
          control={form.control}
          name="procedureId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Procedura Associata (Opzionale)</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(value === "DYAD_EMPTY_VALUE" ? "" : value)}
                value={field.value || "DYAD_EMPTY_VALUE"}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona una procedura" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="DYAD_EMPTY_VALUE">Nessuna Procedura</SelectItem>
                  {procedureList.map((procedure) => (
                    <SelectItem key={procedure.id} value={procedure.id}>
                      {procedure.nome_procedura}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">Salva Punto Servizio</Button>
      </form>
    </Form>
  );
}