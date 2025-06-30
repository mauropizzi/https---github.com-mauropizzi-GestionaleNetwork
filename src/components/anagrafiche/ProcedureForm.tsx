import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { it } from 'date-fns/locale';
import { CalendarIcon } from "lucide-react";

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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { showSuccess, showError } from "@/utils/toast";
import { supabase } from "@/integrations/supabase/client";

const formSchema = z.object({
  nome_procedura: z.string().min(2, "Il nome della procedura è richiesto."),
  descrizione: z.string().optional().nullable(),
  versione: z.string().optional().nullable(),
  data_ultima_revisione: z.date().optional().nullable(),
  responsabile: z.string().optional().nullable(),
  documento_url: z.string().url("Formato URL non valido.").optional().nullable().or(z.literal("")),
  attivo: z.boolean().default(true).optional(),
  note: z.string().optional().nullable(),
});

export function ProcedureForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome_procedura: "",
      descrizione: null,
      versione: null,
      data_ultima_revisione: null,
      responsabile: null,
      documento_url: null,
      attivo: true,
      note: null,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const payload = {
      nome_procedura: values.nome_procedura,
      descrizione: values.descrizione || null,
      versione: values.versione || null,
      data_ultima_revisione: values.data_ultima_revisione ? format(values.data_ultima_revisione, 'yyyy-MM-dd') : null,
      responsabile: values.responsabile || null,
      documento_url: values.documento_url || null,
      attivo: values.attivo,
      note: values.note || null,
    };

    const { data, error } = await supabase
      .from('procedure')
      .insert([payload])
      .select();

    if (error) {
      showError(`Errore durante la registrazione della procedura: ${error.message}`);
      console.error("Error inserting procedure:", error);
    } else {
      showSuccess("Procedura salvata con successo!");
      console.log("Dati Procedura salvati:", data);
      form.reset();
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <h3 className="text-lg font-semibold">Dettagli Procedura</h3>
        <FormField
          control={form.control}
          name="nome_procedura"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome Procedura</FormLabel>
              <FormControl>
                <Input placeholder="Nome della procedura" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="descrizione"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrizione</FormLabel>
              <FormControl>
                <Textarea placeholder="Descrizione dettagliata della procedura..." rows={3} {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="versione"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Versione</FormLabel>
                <FormControl>
                  <Input placeholder="Es: 1.0" {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="data_ultima_revisione"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data Ultima Revisione</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP", { locale: it })
                        ) : (
                          <span>Seleziona una data</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value || undefined}
                      onSelect={field.onChange}
                      initialFocus
                      locale={it}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="responsabile"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Responsabile</FormLabel>
              <FormControl>
                <Input placeholder="Nome del responsabile" {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="documento_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL Documento (Opzionale)</FormLabel>
              <FormControl>
                <Input type="url" placeholder="https://esempio.com/documento.pdf" {...field} value={field.value || ''} />
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
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  Procedura Attiva
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
                <Textarea placeholder="Note sulla procedura..." rows={3} {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">Salva Procedura</Button>
      </form>
    </Form>
  );
}