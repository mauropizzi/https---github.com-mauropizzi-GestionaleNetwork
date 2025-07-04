import React from "react";
import { useForm, FormProvider } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { showSuccess, showError } from "@/utils/toast"; // Import toast utilities
import { supabase } from "@/integrations/supabase/client"; // Import Supabase client

const formSchema = z.object({
  nome_fornitore: z.string().min(2, "La ragione sociale è richiesta."), // Changed to nome_fornitore to match DB
  partita_iva: z.string().optional().nullable(),
  codice_fiscale: z.string().optional().nullable(),
  indirizzo: z.string().optional().nullable(),
  cap: z.string().optional().nullable(),
  citta: z.string().optional().nullable(),
  provincia: z.string().optional().nullable(),
  telefono: z.string().optional().nullable(),
  email: z.string().email("Formato email non valido.").optional().nullable().or(z.literal("")),
  pec: z.string().email("Formato PEC non valido.").optional().nullable().or(z.literal("")),
  tipo_fornitura: z.enum(["piantonamento", "fiduciario", "entrambi"], {
    required_error: "Seleziona un tipo di servizio.",
  }).optional().nullable().or(z.literal("")), // Changed to tipo_fornitura to match DB
  attivo: z.boolean().default(true).optional(),
  note: z.string().optional().nullable(),
});

export function FornitoriForm() {
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
      telefono: null,
      email: null,
      pec: null,
      tipo_fornitura: null,
      attivo: true,
      note: null,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    // Ensure empty strings are converted to null for optional fields
    const payload = {
      nome_fornitore: values.nome_fornitore,
      partita_iva: values.partita_iva || null,
      codice_fiscale: values.codice_fiscale || null,
      indirizzo: values.indirizzo || null,
      cap: values.cap || null,
      citta: values.citta || null,
      provincia: values.provincia || null,
      telefono: values.telefono || null,
      email: values.email || null,
      pec: values.pec || null,
      tipo_fornitura: values.tipo_fornitura || null,
      attivo: values.attivo,
      note: values.note || null,
    };

    const { data, error } = await supabase
      .from('fornitori')
      .insert([payload])
      .select(); // Use .select() to get the inserted data back

    if (error) {
      showError(`Errore durante la registrazione del fornitore: ${error.message}`);
      console.error("Error inserting fornitore:", error);
    } else {
      showSuccess("Fornitore salvato con successo!");
      console.log("Dati Fornitore salvati:", data);
      form.reset(); // Reset form after successful submission
    }
  };

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <h3 className="text-lg font-semibold">Dettagli Fornitore</h3>
        <FormField
          control={form.control}
          name="nome_fornitore" // Changed name to match DB
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
          name="tipo_fornitura" // Changed name to match DB
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
        <Button type="submit" className="w-full">Salva Fornitore</Button>
      </form>
    </FormProvider>
  );
}