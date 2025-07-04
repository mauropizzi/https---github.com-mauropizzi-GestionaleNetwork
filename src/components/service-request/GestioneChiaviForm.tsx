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
import { PuntoServizio, Fornitore } from "@/lib/anagrafiche-data"; // Import PuntoServizio
import { fetchPuntiServizio, fetchFornitori, calculateServiceCost } from "@/lib/data-fetching"; // Import calculateServiceCost
import { showError, showSuccess } from "@/utils/toast";
import { supabase } from "@/integrations/supabase/client"; // Import Supabase client

const timeRegex = /^([01]\d|2[0-3])[:.]([0-5]\d)$/; // Updated regex to accept : or .

const formSchema = z.object({
  servicePointId: z.string().uuid("Seleziona un punto servizio valido.").nonempty("Il punto servizio è richiesto."),
  fornitoreId: z.string().uuid("Seleziona un fornitore valido.").nonempty("Il fornitore è richiesto."),
  startDate: z.date({
    required_error: "La data di inizio è richiesta.",
  }),
  startTime: z.string().regex(timeRegex, "Formato ora inizio non valido (HH:MM o HH.MM)."),
  keyManagementType: z.enum(["verifica chiavi", "consegna chiavi", "ritiro chiavi"], {
    required_error: "Seleziona un tipo di gestione chiavi.",
  }), // New field
});

interface GestioneChiaviFormProps {
  serviceId?: string;
  onSaveSuccess?: () => void;
  onCancel?: () => void;
}

export function GestioneChiaviForm({ serviceId, onSaveSuccess, onCancel }: GestioneChiaviFormProps) {
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
      keyManagementType: "verifica chiavi", // Default value for new field
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
            startTime: service.start_time || "09:00",
            keyManagementType: (service.inspection_type as "verifica chiavi" | "consegna chiavi" | "ritiro chiavi") || "verifica chiavi", // Populate new field from inspection_type
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

    // Normalize time input
    const normalizedStartTime = values.startTime.replace('.', ':');

    const costDetails = {
      type: "Gestione Chiavi",
      client_id: clientId,
      service_point_id: values.servicePointId,
      fornitore_id: values.fornitoreId,
      start_date: values.startDate,
      end_date: values.startDate, // End date is same as start date for one-off
      start_time: normalizedStartTime,
      end_time: normalizedStartTime, // End time is same as start time for one-off
      num_agents: null, // Not applicable for Gestione Chiavi
      cadence_hours: null, // Not applicable for Gestione Chiavi
      daily_hours_config: null, // Not applicable for Gestione Chiavi
      inspection_type: values.keyManagementType, // Pass keyManagementType for cost calculation
    };

    const calculatedResult = await calculateServiceCost(costDetails);

    const payload = {
      type: "Gestione Chiavi",
      client_id: clientId,
      service_point_id: values.servicePointId,
      fornitore_id: values.fornitoreId,
      start_date: format(values.startDate, 'yyyy-MM-dd'),
      start_time: normalizedStartTime,
      end_date: format(values.startDate, 'yyyy-MM-dd'), // Set end_date to start_date
      end_time: normalizedStartTime, // Set end_time to start_time
      status: "Pending",
      calculated_cost: calculatedResult ? (calculatedResult.multiplier * calculatedResult.clientRate) : null, // Corrected here
      total_units: calculatedResult ? calculatedResult.multiplier : null, // Salva il moltiplicatore
      unit_of_measure: calculatedResult ? calculatedResult.unitOfMeasure : null, // Salva l'unità di misura
      num_agents: null,
      cadence_hours: null,
      inspection_type: values.keyManagementType, // Save keyManagementType to inspection_type
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
      showSuccess(`Richiesta di gestione chiavi ${serviceId ? 'modificata' : 'registrata'} con successo!`);
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
                <FormLabel>Data del servizio</FormLabel>
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
                <FormLabel>Ora del servizio (HH:MM)</FormLabel>
                <FormControl>
                  <Input type="text" placeholder="09:00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        {/* New field for Key Management Type */}
        <FormField
          control={form.control}
          name="keyManagementType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo Gestione Chiavi</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona tipo gestione chiavi" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="verifica chiavi">Verifica Chiavi</SelectItem>
                  <SelectItem value="consegna chiavi">Consegna Chiavi</SelectItem>
                  <SelectItem value="ritiro chiavi">Ritiro Chiavi</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
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