import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
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
import { PuntoServizio, Fornitore } from "@/lib/anagrafiche-data";
import { fetchPuntiServizio, fetchFornitori, calculateServiceCost } from "@/lib/data-fetching";
import { showError, showSuccess } from "@/utils/toast";
import { supabase } from "@/integrations/supabase/client";

const formSchema = z.object({
  servicePointId: z.string().uuid("Seleziona un punto servizio valido.").nonempty("Il punto servizio è richiesto."),
  fornitoreId: z.string().uuid("Seleziona un fornitore valido.").nonempty("Il fornitore è richiesto."),
  startDate: z.date({
    required_error: "La data di inizio è richiesta.",
  }),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato ora inizio non valido (HH:MM)."),
  endDate: z.date({
    required_error: "La data di fine è richiesta.",
  }),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato ora fine non valido (HH:MM)."),
}).refine(data => {
  const startDateTimeStr = `${format(data.startDate, "yyyy-MM-dd")}T${data.startTime}:00`;
  const endDateTimeStr = `${format(data.endDate, "yyyy-MM-dd")}T${data.endTime}:00`;
  const start = parseISO(startDateTimeStr);
  const end = parseISO(endDateTimeStr);
  return isValid(start) && isValid(end) && end.getTime() >= start.getTime();
}, {
  message: "La data/ora di fine non può essere precedente alla data/ora di inizio.",
  path: ["endDate"],
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
      startTime: "09:00",
      endDate: new Date(),
      endTime: "17:00",
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
            startDate: service.start_date ? parseISO(service.start_date) : new Date(),
            startTime: service.start_time || "09:00",
            endDate: service.end_date ? parseISO(service.end_date) : new Date(),
            endTime: service.end_time || "17:00",
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
      start_time: values.startTime,
      end_time: values.endTime,
    };

    const calculatedCost = await calculateServiceCost(costDetails);

    const payload = {
      type: "Apertura/Chiusura",
      client_id: clientId,
      service_point_id: values.servicePointId,
      fornitore_id: values.fornitoreId,
      start_date: format(values.startDate, 'yyyy-MM-dd'),
      start_time: values.startTime,
      end_date: format(values.endDate, 'yyyy-MM-dd'),
      end_time: values.endTime,
      status: "Pending",
      calculated_cost: calculatedCost,
      num_agents: null,
      cadence_hours: null,
      inspection_type: null,
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

  if (loadingInitialData) {
    return <div className="text-center py-8">Caricamento dati servizio...</div>;
  }

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
            name="startTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ora di inizio servizio (HH:MM)</FormLabel>
                <FormControl>
                  <Input type="text" placeholder="09:00" {...field} />
                </FormControl>
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
          <FormField
            control={form.control}
            name="endTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ora di fine servizio (HH:MM)</Label>
                <FormControl>
                  <Input type="text" placeholder="17:00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
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
    </Form>
  );
}