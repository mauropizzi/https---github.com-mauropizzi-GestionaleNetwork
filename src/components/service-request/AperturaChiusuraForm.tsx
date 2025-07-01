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

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

const formSchema = z.object({
  servicePointId: z.string().uuid("Seleziona un punto servizio valido.").nonempty("Il punto servizio è richiesto."),
  fornitoreId: z.string().uuid("Seleziona un fornitore valido.").nonempty("Il fornitore è richiesto."),
  startDate: z.date({
    required_error: "La data di inizio è richiesta.",
  }),
  endDate: z.date({
    required_error: "La data di fine è richiesta.",
  }),
  aperturaTime: z.string().regex(timeRegex, "Formato ora apertura non valido (HH:MM).").optional().or(z.literal("")),
  chiusuraTime: z.string().regex(timeRegex, "Formato ora chiusura non valido (HH:MM).").optional().or(z.literal("")),
  operationType: z.enum(["Apertura", "Chiusura", "Entrambi"], {
    required_error: "Seleziona un tipo di operazione.",
  }),
}).refine(data => {
  // Validate overall date range
  return data.endDate >= data.startDate;
}, {
  message: "La data di fine non può essere precedente alla data di inizio.",
  path: ["endDate"],
}).refine(data => {
  // Validate times based on operationType
  if (data.operationType === "Apertura" && !data.aperturaTime) {
    return false;
  }
  if (data.operationType === "Chiusura" && !data.chiusuraTime) {
    return false;
  }
  if (data.operationType === "Entrambi" && (!data.aperturaTime || !data.chiusuraTime)) {
    return false;
  }
  return true;
}, {
  message: "Inserisci l'orario/gli orari richiesti per il tipo di operazione.",
  path: ["aperturaTime"], // This path is a bit generic, but Zod will point to the first failing one.
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
      endDate: new Date(),
      aperturaTime: "",
      chiusuraTime: "",
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
            startDate: service.start_date ? parseISO(service.start_date) : new Date(),
            endDate: service.end_date ? parseISO(service.end_date) : new Date(),
            aperturaTime: service.start_time || "", // Map start_time to aperturaTime
            chiusuraTime: service.end_time || "", // Map end_time to chiusuraTime
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
      start_time: values.aperturaTime || null, // Pass aperturaTime for cost calculation
      end_time: values.chiusuraTime || null, // Pass chiusuraTime for cost calculation
      inspection_type: values.operationType, // Pass operationType for cost calculation
    };

    const calculatedCost = await calculateServiceCost(costDetails);

    const payload = {
      type: "Apertura/Chiusura",
      client_id: clientId,
      service_point_id: values.servicePointId,
      fornitore_id: values.fornitoreId,
      start_date: format(values.startDate, 'yyyy-MM-dd'),
      start_time: values.aperturaTime || null, // Save aperturaTime to start_time
      end_date: format(values.endDate, 'yyyy-MM-dd'),
      end_time: values.chiusuraTime || null, // Save chiusuraTime to end_time
      status: "Pending",
      calculated_cost: calculatedCost,
      num_agents: null,
      cadence_hours: null,
      inspection_type: values.operationType, // Save operationType to inspection_type
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
              name="aperturaTime"
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
              name="chiusuraTime"
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
    </Form>
  );
}