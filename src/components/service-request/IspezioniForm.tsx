import React, { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, parseISO, isValid, addDays, isWeekend } from "date-fns";
import { it } from 'date-fns/locale';
import { CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
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
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { isDateHoliday } from "@/lib/date-utils";
import { PuntoServizio, Fornitore } from "@/lib/anagrafiche-data"; // Import PuntoServizio
import { fetchPuntiServizio, fetchFornitori, calculateServiceCost } from "@/lib/data-fetching"; // Import calculateServiceCost
import { showError, showSuccess } from "@/utils/toast";
import { supabase } from "@/integrations/supabase/client"; // Import Supabase client

const dailyHoursSchema = z.object({
  day: z.string(),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato ora non valido (HH:MM).").or(z.literal("")),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato ora non valido (HH:MM).").or(z.literal("")),
  is24h: z.boolean().default(false),
}).refine(data => data.is24h || (data.startTime !== "" && data.endTime !== ""), {
  message: "Inserisci orari o seleziona H24.",
  path: ["startTime"],
}).refine(data => data.is24h || (data.startTime !== "" && data.endTime !== ""), {
  message: "Inserisci orari o seleziona H24.",
  path: ["endTime"],
});

const formSchema = z.object({
  servicePointId: z.string().uuid("Seleziona un punto servizio valido.").nonempty("Il punto servizio è richiesto."),
  fornitoreId: z.string().uuid("Seleziona un fornitore valido.").nonempty("Il fornitore è richiesto."),
  startDate: z.date({
    required_error: "La data di inizio servizio è richiesta.",
  }),
  endDate: z.date({
    required_error: "La data di fine servizio è richiesta.",
  }),
  cadenceHours: z.coerce.number().min(0.5, "La cadenza deve essere di almeno 0.5 ore.").max(24, "La cadenza non può superare le 24 ore."),
  inspectionType: z.enum(["perimetrale", "interna", "completa"], {
    required_error: "Seleziona un tipo di ispezione.",
  }),
  dailyHours: z.array(dailyHoursSchema).min(8, "Definisci gli orari per tutti i giorni e i festivi."),
}).refine(data => {
  return data.endDate.getTime() >= data.startDate.getTime();
}, {
  message: "La data di fine non può essere precedente alla data di inizio.",
  path: ["endDate"],
});

export function IspezioniForm() {
  const [puntiServizio, setPuntiServizio] = useState<PuntoServizio[]>([]);
  const [fornitori, setFornitori] = useState<Fornitore[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const fetchedPuntiServizio = await fetchPuntiServizio();
      const fetchedFornitori = await fetchFornitori();
      setPuntiServizio(fetchedPuntiServizio);
      setFornitori(fetchedFornitori);
    };
    loadData();
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      servicePointId: "",
      fornitoreId: "",
      cadenceHours: 2,
      inspectionType: "perimetrale",
      dailyHours: [
        { day: "Lunedì", startTime: "09:00", endTime: "17:00", is24h: false },
        { day: "Martedì", startTime: "09:00", endTime: "17:00", is24h: false },
        { day: "Mercoledì", startTime: "09:00", endTime: "17:00", is24h: false },
        { day: "Giovedì", startTime: "09:00", endTime: "17:00", is24h: false },
        { day: "Venerdì", startTime: "09:00", endTime: "17:00", is24h: false },
        { day: "Sabato", startTime: "09:00", endTime: "13:00", is24h: false },
        { day: "Domenica", startTime: "", endTime: "", is24h: true },
        { day: "Festivi", startTime: "", endTime: "", is24h: true },
      ],
    },
  });

  const { fields } = useFieldArray({
    control: form.control,
    name: "dailyHours",
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    // Get the client_id from the selected service point
    const selectedServicePoint = puntiServizio.find(p => p.id === values.servicePointId);
    const clientId = selectedServicePoint?.id_cliente || null;

    if (!clientId) {
      showError("Impossibile determinare il cliente associato al punto servizio.");
      return;
    }

    const costDetails = {
      type: "Ispezioni",
      client_id: clientId,
      service_point_id: values.servicePointId,
      fornitore_id: values.fornitoreId,
      start_date: values.startDate,
      end_date: values.endDate,
      cadence_hours: values.cadenceHours,
      inspection_type: values.inspectionType,
      daily_hours_config: values.dailyHours,
    };

    const calculatedCost = await calculateServiceCost(costDetails);

    // Prepare data for Supabase insertion
    const payload = {
      type: "Ispezioni", // Fixed type for this form
      client_id: clientId, // Now correctly setting client_id
      service_point_id: values.servicePointId,
      start_date: format(values.startDate, 'yyyy-MM-dd'),
      start_time: null, // Detailed times are in daily_hours_config
      end_date: format(values.endDate, 'yyyy-MM-dd'),
      end_time: null, // Detailed times are in daily_hours_config
      status: "Pending", // Default status
      calculated_cost: calculatedCost, // Now including the calculated cost
      num_agents: null, // Not applicable for Ispezioni
      cadence_hours: values.cadenceHours,
      inspection_type: values.inspectionType,
      daily_hours_config: values.dailyHours, // Save the daily hours configuration
    };

    const { data, error } = await supabase
      .from('servizi_richiesti')
      .insert([payload]);

    if (error) {
      showError(`Errore durante la registrazione della richiesta: ${error.message}`);
      console.error("Error inserting service request:", error);
    } else {
      showSuccess("Richiesta di ispezione registrata con successo!");
      console.log("Service request saved successfully:", data);
      form.reset(); // Reset form after successful submission
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="servicePointId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Punto Servizio</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona un punto servizio" />
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
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona un fornitore" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
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
            name="startDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data di inizio servizio</FormLabel>
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
                <FormLabel>Data di fine servizio</FormLabel>
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
          name="cadenceHours"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cadenza oraria per ispezioni (ore)</FormLabel>
              <FormControl>
                <Input type="number" step="0.5" placeholder="2" {...field} onChange={e => field.onChange(e.target.valueAsNumber)} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="inspectionType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo di ispezione</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona un tipo di ispezione" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="perimetrale">Perimetrale</SelectItem>
                  <SelectItem value="interna">Interna</SelectItem>
                  <SelectItem value="completa">Completa</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Separator className="my-8" />

        <h3 className="text-lg font-semibold mb-4">Orari giornalieri specifici</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Definisci gli orari di servizio per ogni giorno della settimana e per i giorni festivi.
          Seleziona "H24" per un servizio continuo di 24 ore.
        </p>

        <div className="space-y-4">
          {fields.map((item, index) => (
            <div key={item.id} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center p-4 border rounded-md">
              <Label className="col-span-1 font-medium">{item.day}</Label>
              <FormField
                control={form.control}
                name={`dailyHours.${index}.startTime`}
                render={({ field }) => (
                  <FormItem className="col-span-1">
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="HH:MM"
                        {...field}
                        disabled={form.watch(`dailyHours.${index}.is24h`)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <span className="text-center">-</span>
              <FormField
                control={form.control}
                name={`dailyHours.${index}.endTime`}
                render={({ field }) => (
                  <FormItem className="col-span-1">
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="HH:MM"
                        {...field}
                        disabled={form.watch(`dailyHours.${index}.is24h`)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`dailyHours.${index}.is24h`}
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-2 space-y-0 col-span-1">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          field.onChange(checked);
                          if (checked) {
                            form.setValue(`dailyHours.${index}.startTime`, "");
                            form.setValue(`dailyHours.${index}.endTime`, "");
                          }
                        }}
                      />
                    </FormControl>
                    <FormLabel className="!mt-0">H24</FormLabel>
                  </FormItem>
                )}
              />
            </div>
          ))}
        </div>

        <Button type="submit" className="w-full">Registra Richiesta</Button>
      </form>
    </Form>
  );
}