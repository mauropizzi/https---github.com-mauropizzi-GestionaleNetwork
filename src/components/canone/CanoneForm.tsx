import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { it } from 'date-fns/locale';
import { CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { showSuccess, showError } from "@/utils/toast";
import { useAnagraficheData } from "@/hooks/use-anagrafiche-data"; // Import the new hook
import { supabase } from "@/integrations/supabase/client";

const tipoCanoneOptions = [
  "Disponibilità Pronto Intervento",
  "Videosorveglianza",
  "Impianto Allarme",
  "Bidirezionale",
  "Monodirezionale",
  "Tenuta Chiavi",
];

const formSchema = z.object({
  servicePointId: z.string().uuid("Seleziona un punto servizio valido.").nonempty("Il punto servizio è richiesto."),
  fornitoreId: z.string().uuid("Seleziona un fornitore valido.").optional().or(z.literal("")),
  tipoCanone: z.string().min(1, "Il tipo di canone è richiesto."),
  startDate: z.date({
    required_error: "La data di inizio è richiesta.",
  }),
  endDate: z.date().optional(),
  status: z.enum(["Attivo", "Inattivo", "Sospeso"], {
    required_error: "Seleziona uno stato.",
  }).default("Attivo"),
  notes: z.string().optional(),
}).refine(data => {
  if (data.startDate && data.endDate) {
    return data.endDate >= data.startDate;
  }
  return true;
}, {
  message: "La data di fine non può essere precedente alla data di inizio.",
  path: ["endDate"],
});

export function CanoneForm() {
  const { puntiServizio, fornitori, loading } = useAnagraficheData(); // Use the hook

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      servicePointId: "",
      fornitoreId: "",
      tipoCanone: "",
      startDate: new Date(),
      endDate: undefined,
      status: "Attivo",
      notes: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const payload = {
      service_point_id: values.servicePointId,
      fornitore_id: values.fornitoreId || null,
      tipo_canone: values.tipoCanone,
      start_date: format(values.startDate, 'yyyy-MM-dd'),
      end_date: values.endDate ? format(values.endDate, 'yyyy-MM-dd') : null,
      status: values.status,
      notes: values.notes || null,
    };

    const { data, error } = await supabase
      .from('servizi_canone') // Use the new table
      .insert([payload])
      .select();

    if (error) {
      showError(`Errore durante la registrazione del servizio a canone: ${error.message}`);
      console.error("Error inserting servizi_canone:", error);
    } else {
      showSuccess("Servizio a canone salvato con successo!");
      console.log("Dati Servizio a Canone salvati:", data);
      form.reset({
        servicePointId: "",
        fornitoreId: "",
        tipoCanone: "",
        startDate: new Date(),
        endDate: undefined,
        status: "Attivo",
        notes: "",
      });
    }
  };

  if (loading) {
    return <div>Caricamento dati anagrafici...</div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <h3 className="text-lg font-semibold">Dettagli Nuovo Servizio a Canone</h3>
        <FormField
          control={form.control}
          name="servicePointId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Punto Servizio *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona punto servizio" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {puntiServizio.map((punto) => (
                    <SelectItem key={punto.id} value={punto.id}>
                      {punto.nome_punto_servizio}
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
          name="fornitoreId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fornitore</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(value === "DYAD_EMPTY_VALUE" ? "" : value)}
                value={field.value || "DYAD_EMPTY_VALUE"}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona fornitore" />
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
        <FormField
          control={form.control}
          name="tipoCanone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo Canone (Servizio Mensile) *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona tipo canone" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {tipoCanoneOptions.map((option) => (
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data Inizio *</FormLabel>
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
                          <span>gg/mm/aaaa</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
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
          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data Fine</FormLabel>
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
                          <span>gg/mm/aaaa</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
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
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Stato</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona stato" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Attivo">Attivo</SelectItem>
                  <SelectItem value="Inattivo">Inattivo</SelectItem>
                  <SelectItem value="Sospeso">Sospeso</SelectItem>
                </SelectContent>
              </Select>
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
                <Textarea placeholder="Note aggiuntive..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">Salva Servizio a Canone</Button>
      </form>
    </Form>
  );
}