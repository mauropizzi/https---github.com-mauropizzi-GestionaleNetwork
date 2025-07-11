import React, { useState, useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, parseISO, isValid } from "date-fns";
import { it } from 'date-fns/locale';
import { CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
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
import { PuntoServizio, Fornitore } from "@/lib/anagrafiche-data";
import { fetchPuntiServizio, fetchFornitori, calculateServiceCost } from "@/lib/data-fetching";
import { showError, showSuccess } from "@/utils/toast";
import { supabase } from "@/integrations/supabase/client";

const timeRegex = /^([01]\d|2[0-3])[:.]([0-5]\d)$/; // Updated regex to accept : or .

const formSchema = z.object({
  servicePointId: z.string().uuid("Seleziona un punto servizio valido.").nonempty("Il punto servizio è richiesto."),
  fornitoreId: z.string().uuid("Seleziona un fornitore valido.").nonempty("Il fornitore è richiesto."),
  startDate: z.date({
    required_error: "La data di inizio è richiesta.",
  }),
  startTime: z.string().regex(timeRegex, "Formato ora inizio non valido (HH:MM o HH.MM).").or(z.literal("")), // Made optional for validation in onSubmit
  endDate: z.date({
    required_error: "La data di fine è richiesta.",
  }),
  endTime: z.string().regex(timeRegex, "Formato ora fine non valido (HH:MM o HH.MM).").or(z.literal("")), // Made optional for validation in onSubmit
  operationType: z.enum(["Apertura", "Chiusura", "Entrambi"], {
    required_error: "Seleziona un tipo di operazione.",
  }),
});

interface AperturaChiusuraFormProps {
  serviceId?: string;
  onSaveSuccess?: () => void;
  onCancel?: () => void;
}

export function AperturaChiusuraForm({ serviceId, onSaveSuccess, onCancel }: AperturaChiusuraFormProps) {
  const [puntiServizio, setPuntiServizio] = useState<PuntoServizio[]>([]);
  const [fornitori, setFornitori] = useState<Fornitore[]>([]);
  const [loadingInitialData, setLoadingInitialData] = useState(!!serviceId);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      servicePointId: "",
      fornitoreId: "",
      startDate: new Date(),
      startTime: "", // Default to empty string
      endDate: new Date(),
      endTime: "", // Default to empty string
      operationType: "Apertura",
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
            startTime: service.start_time || "",
            endDate: (service.end_date && typeof service.end_date === 'string') ? parseISO(service.end_date) : new Date(),
            endTime: service.end_time || "",
            operationType: (service.inspection_type as "Apertura" | "Chiusura" | "Entrambi") || "Apertura",
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

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const normalizedStartTime = values.startTime.replace('.', ':');
    const normalizedEndTime = values.endTime.replace('.', ':');
    
    const start = values.startDate;
    const end = values.endDate;

    // Combine date with time for a full datetime comparison using local time
    const startDateTime = new Date(start.getFullYear(), start.getMonth(), start.getDate(), 
                                   parseInt(normalizedStartTime.split(':')[0]), parseInt(normalizedStartTime.split(':')[1]));
    const endDateTime = new Date(end.getFullYear(), end.getMonth(), end.getDate(),
                                 parseInt(normalizedEndTime.split(':')[0]), parseInt(normalizedEndTime.split(':')[1]));

    if (endDateTime.getTime() < startDateTime.getTime()) {
      form.setError("endDate", {
        type: "manual",
        message: "La data/ora di fine non può essere precedente alla data/ora di inizio.",
      });
      showError("La data/ora di fine non può essere precedente alla data/ora di inizio.");
      return;
    }

    // Validate times based on operationType
    if (values.operationType === "Apertura" && !values.startTime) {
      form.setError("startTime", { type: "manual", message: "L'ora di apertura è richiesta." });
      showError("L'ora di apertura è richiesta.");
      return;
    }
    if (values.operationType === "Chiusura" && !values.endTime) {
      form.setError("endTime", { type: "manual", message: "L'ora di chiusura è richiesta." });
      showError("L'ora di chiusura è richiesta.");
      return;
    }
    if (values.operationType === "Entrambi" && (!values.startTime || !values.endTime)) {
      form.setError("startTime", { type: "manual", message: "Entrambe le ore di apertura e chiusura sono richieste." });
      showError("Entrambe le ore di apertura e chiusura sono richieste.");
      return;
    }

    const selectedServicePoint = puntiServizio.find(p => p.id === values.servicePointId);
    const clientId = selectedServicePoint?.id_cliente || null;

    if (!clientId) {
      showError("Impossibile determinare il cliente associato al punto servizio.");
      return;
    }

    const costDetails = {
      type: "Apertura/Chiusura",
      client_id: clientId,
      service_point_id: values.servicePointId,
      fornitore_id: values.fornitoreId,
      start_date: values.startDate,
      end_date: values.endDate,
      start_time: normalizedStartTime,
      end_time: normalizedEndTime,
      num_agents: null, // Not applicable for Apertura/Chiusura
      cadence_hours: null, // Not applicable for Apertura/Chiusura
      daily_hours_config: null, // Not applicable for Apertura/Chiusura
      inspection_type: values.operationType,
    };

    const calculatedResult = await calculateServiceCost(costDetails);

    const payload = {
      type: "Apertura/Chiusura",
      client_id: clientId,
      service_point_id: values.servicePointId,
      fornitore_id: values.fornitoreId,
      start_date: format(values.startDate, 'yyyy-MM-dd'),
      start_time: normalizedStartTime,
      end_date: format(values.endDate, 'yyyy-MM-dd'),
      end_time: normalizedEndTime,
      status: "Pending",
      calculated_cost: calculatedResult ? (calculatedResult.multiplier * calculatedResult.clientRate) : null, // Corrected here
      total_units: calculatedResult ? calculatedResult.multiplier : null, // Salva il moltiplicatore
      unit_of_measure: calculatedResult ? calculatedResult.unitOfMeasure : null, // Salva l'unità di misura
      num_agents: null,
      cadence_hours: null,
      inspection_type: values.operationType,
      daily_hours_config: null,
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
      showSuccess(`Richiesta di apertura/chiusura ${serviceId ? 'modificata' : 'registrata'} con successo!`);
      console.log(`Service request ${serviceId ? 'updated' : 'saved'} successfully:`, result.data);
      form.reset();
      onSaveSuccess?.();
    }
  };

  const operationType = form.watch("operationType");

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
          name="operationType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo Operazione</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona tipo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Apertura">Apertura</SelectItem>
                  <SelectItem value="Chiusura">Chiusura</SelectItem>
                  <SelectItem value="Entrambi">Entrambi</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(operationType === "Apertura" || operationType === "Entrambi") && (
            <FormField
              control={form.control}
              name="startTime" // This is now aperturaTime
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ora Apertura (HH:MM)</FormLabel>
                  <FormControl>
                    <Input type="text" placeholder="09:00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          {(operationType === "Chiusura" || operationType === "Entrambi") && (
            <FormField
              control={form.control}
              name="endTime" // This is now chiusuraTime
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ora Chiusura (HH:MM)</FormLabel>
                  <FormControl>
                    <Input type="text" placeholder="17:00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
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