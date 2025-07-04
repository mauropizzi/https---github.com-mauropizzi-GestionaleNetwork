import React, { useState, useEffect } from "react";
import { useForm, useFieldArray, FormProvider } from "react-hook-form";
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

const timeRegex = /^([01]\d|2[0-3])[:.]([0-5]\d)$/; // Updated regex to accept : or .

const dailyHoursSchema = z.object({
  day: z.string().min(1, "Il giorno è richiesto."),
  startTime: z.string().regex(timeRegex, "Formato ora non valido (HH:MM o HH.MM).").or(z.literal("")),
  endTime: z.string().regex(timeRegex, "Formato ora non valido (HH:MM o HH.MM).").or(z.literal("")),
  is24h: z.boolean().default(false),
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
});

interface IspezioniFormProps {
  serviceId?: string;
  onSaveSuccess?: () => void;
  onCancel?: () => void;
}

export function IspezioniForm({ serviceId, onSaveSuccess, onCancel }: IspezioniFormProps) {
  const [puntiServizio, setPuntiServizio] = useState<PuntoServizio[]>([]);
  const [fornitori, setFornitori] = useState<Fornitore[]>([]);
  const [loadingInitialData, setLoadingInitialData] = useState(!!serviceId);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      servicePointId: "",
      fornitoreId: "",
      startDate: new Date(),
      endDate: new Date(),
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

  useEffect(() => {
    const loadInitialServiceData = async () => {
      if (serviceId) {
        setLoadingInitialData(true);
        const { data: service, error } = await supabase
          .from('servizi_richiesti')
          .select('*')
          .eq('id', serviceId)
          .single();

        if (error) {
          showError(`Errore nel recupero del servizio: ${error.message}`);
          console.error("Error fetching service for edit:", error);
          setLoadingInitialData(false);
          return;
        }

        if (service) {
          form.reset({
            servicePointId: service.service_point_id || "",
            fornitoreId: service.fornitore_id || "",
            startDate: (service.start_date && typeof service.start_date === 'string') ? parseISO(service.start_date) : new Date(),
            endDate: (service.end_date && typeof service.end_date === 'string') ? parseISO(service.end_date) : new Date(),
            cadenceHours: service.cadence_hours || 2,
            inspectionType: (service.inspection_type as "perimetrale" | "interna" | "completa") || "perimetrale",
            dailyHours: service.daily_hours_config || [
              { day: "Lunedì", startTime: "09:00", endTime: "17:00", is24h: false },
              { day: "Martedì", startTime: "09:00", endTime: "17:00", is24h: false },
              { day: "Mercoledì", startTime: "09:00", endTime: "17:00", is24h: false },
              { day: "Giovedì", startTime: "09:00", endTime: "17:00", is24h: false },
              { day: "Venerdì", startTime: "09:00", endTime: "17:00", is24h: false },
              { day: "Sabato", startTime: "09:00", endTime: "13:00", is24h: false },
              { day: "Domenica", startTime: "", endTime: "", is24h: true },
              { day: "Festivi", startTime: "", endTime: "", is24h: true },
            ],
          });
        }
        setLoadingInitialData(false);
      }
    };

    loadInitialServiceData();
  }, [serviceId, form]);

  useEffect(() => {
    const loadDropdownData = async () => {
      const fetchedPuntiServizio = await fetchPuntiServizio();
      const fetchedFornitori = await fetchFornitori();
      setPuntiServizio(fetchedPuntiServizio);
      setFornitori(fetchedFornitori);
    };
    loadDropdownData();
  }, []);

  const { fields } = useFieldArray({
    control: form.control,
    name: "dailyHours",
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (values.endDate.getTime() < values.startDate.getTime()) {
      form.setError("endDate", {
        type: "manual",
        message: "La data di fine non può essere precedente alla data di inizio.",
      });
      showError("La data di fine non può essere precedente alla data di inizio.");
      return;
    }

    for (const [index, dayConfig] of values.dailyHours.entries()) {
      if (!dayConfig.is24h && (!dayConfig.startTime || !dayConfig.endTime)) {
        form.setError(`dailyHours.${index}.startTime`, {
          type: "manual",
          message: "Inserisci orari o seleziona H24.",
        });
        showError(`Per ${dayConfig.day}: Inserisci orari o seleziona H24.`);
        return;
      }
    }

    const selectedServicePoint = puntiServizio.find(p => p.id === values.servicePointId);
    const clientId = selectedServicePoint?.id_cliente || null;

    if (!clientId) {
      showError("Impossibile determinare il cliente associato al punto servizio.");
      return;
    }

    const normalizedDailyHours = values.dailyHours.map(dh => ({
      day: dh.day,
      startTime: dh.startTime.replace('.', ':'),
      endTime: dh.endTime.replace('.', ':'),
      is24h: dh.is24h,
    }));

    let effectiveStartTime = "00:00";
    let effectiveEndTime = "23:59";

    const firstValidDayConfig = normalizedDailyHours.find(d => d.is24h || (d.startTime && d.endTime));
    if (firstValidDayConfig) {
        if (firstValidDayConfig.is24h) {
            effectiveStartTime = "00:00";
            effectiveEndTime = "23:59";
        } else {
            effectiveStartTime = firstValidDayConfig.startTime;
            effectiveEndTime = firstValidDayConfig.endTime;
        }
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
      daily_hours_config: normalizedDailyHours,
      start_time: effectiveStartTime,
      end_time: effectiveEndTime,
    };

    const calculatedCostResult = await calculateServiceCost(costDetails);

    const payload = {
      type: "Ispezioni",
      client_id: clientId,
      service_point_id: values.servicePointId,
      fornitore_id: values.fornitoreId,
      start_date: format(values.startDate, 'yyyy-MM-dd'),
      start_time: effectiveStartTime,
      end_date: format(values.endDate, 'yyyy-MM-dd'),
      end_time: effectiveEndTime,
      status: "Pending",
      calculated_cost: calculatedCostResult ? (calculatedCostResult.multiplier * calculatedCostResult.clientRate) : null,
      num_agents: null,
      cadence_hours: values.cadenceHours,
      inspection_type: values.inspectionType,
      daily_hours_config: normalizedDailyHours,
    };

    let result;
    if (serviceId) {
      result = await supabase
        .from('servizi_richiesti')
        .update(payload)
        .eq('id', serviceId);
    } else {
      result = await supabase
        .from('servizi_richiesti')
        .insert([payload]);
    }

    if (result.error) {
      showError(`Errore durante la ${serviceId ? 'modifica' : 'registrazione'} della richiesta: ${result.error.message}`);
      console.error(`Error ${serviceId ? 'updating' : 'inserting'} service request:`, result.error);
    } else {
      showSuccess(`Richiesta di ispezione ${serviceId ? 'modificata' : 'registrata'} con successo!`);
      console.log(`Service request ${serviceId ? 'updated' : 'saved'} successfully:`, result.data);
      form.reset();
      onSaveSuccess?.();
    }
  };

  if (loadingInitialData) {
    return <div className="text-center py-8">Caricamento dati servizio...</div>;
  }

  return (
    <FormProvider {...form}>
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

        <div className="flex justify-end gap-2 mt-6">
          {serviceId && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Annulla
            </Button>
          )}
          <Button type="submit" className="w-full">
            {serviceId ? "Salva Modifiche" : "Registra Richiesta"}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}