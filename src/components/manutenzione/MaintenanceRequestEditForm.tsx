import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, parseISO, isValid } from "date-fns";
import { it } from 'date-fns/locale';
import { CalendarIcon, Check, ChevronsUpDown } from "lucide-react";

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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { showSuccess, showError } from "@/utils/toast";
import { supabase } from "@/integrations/supabase/client";
import { PuntoServizio, Personale, RichiestaManutenzione } from "@/lib/anagrafiche-data";
import { fetchPuntiServizio, fetchPersonale } from "@/lib/data-fetching";

const formSchema = z.object({
  service_point_id: z.string().uuid("Seleziona un punto servizio valido.").optional().nullable(),
  vehicle_plate: z.string().min(1, "La targa del veicolo è richiesta."),
  issue_description: z.string().min(1, "La descrizione del problema è richiesta."),
  status: z.enum(["Pending", "In Progress", "Completed", "Cancelled"], {
    required_error: "Lo stato è richiesto.",
  }),
  priority: z.enum(["Low", "Medium", "High", "Urgent"], {
    required_error: "La priorità è richiesta.",
  }),
  requested_by_employee_id: z.string().uuid("Seleziona un dipendente valido.").nonempty("Il dipendente che ha richiesto la manutenzione è richiesto."), // Made required
  requested_at: z.date({
    required_error: "La data di richiesta è richiesta.",
  }),
  repair_activities: z.string().optional().nullable(), // Nuovo campo
});

interface MaintenanceRequestEditFormProps {
  requestId: string;
  onSaveSuccess: () => void;
  onCancel: () => void;
}

export function MaintenanceRequestEditForm({ requestId, onSaveSuccess, onCancel }: MaintenanceRequestEditFormProps) {
  const [puntiServizioList, setPuntiServizioList] = useState<PuntoServizio[]>([]);
  const [personaleList, setPersonaleList] = useState<Personale[]>([]);
  const [loadingInitialData, setLoadingInitialData] = useState(true);

  const [isServicePointSelectOpen, setIsServicePointSelectOpen] = useState(false);
  const [isEmployeeSelectOpen, setIsEmployeeSelectOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      service_point_id: null,
      vehicle_plate: "",
      issue_description: "",
      status: "Pending",
      priority: "Medium",
      requested_by_employee_id: "", // Changed default to empty string for required field
      requested_at: new Date(),
      repair_activities: null, // Default per il nuovo campo
    },
  });

  useEffect(() => {
    const loadDropdownData = async () => {
      const fetchedPuntiServizio = await fetchPuntiServizio();
      setPuntiServizioList(fetchedPuntiServizio);
      const fetchedPersonale = await fetchPersonale();
      setPersonaleList(fetchedPersonale);
    };
    loadDropdownData();
  }, []);

  useEffect(() => {
    const fetchRequestData = async () => {
      if (requestId) {
        setLoadingInitialData(true);
        const { data: request, error } = await supabase
          .from('richieste_manutenzione')
          .select('*')
          .eq('id', requestId)
          .single();

        if (error) {
          showError(`Errore nel recupero della richiesta: ${error.message}`);
          console.error("Error fetching maintenance request for edit:", error);
          setLoadingInitialData(false);
          return;
        }

        if (request) {
          form.reset({
            service_point_id: request.service_point_id || null,
            vehicle_plate: request.vehicle_plate || "",
            issue_description: request.issue_description || "",
            status: request.status,
            priority: request.priority,
            requested_by_employee_id: request.requested_by_employee_id || "", // Ensure it's not null for required field
            requested_at: (request.requested_at && typeof request.requested_at === 'string') ? parseISO(request.requested_at) : new Date(),
            repair_activities: request.repair_activities || null, // Popola il nuovo campo
          });
        }
        setLoadingInitialData(false);
      }
    };
    fetchRequestData();
  }, [requestId, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const payload = {
      service_point_id: values.service_point_id,
      vehicle_plate: values.vehicle_plate,
      issue_description: values.issue_description,
      status: values.status,
      priority: values.priority,
      requested_by_employee_id: values.requested_by_employee_id,
      requested_at: format(values.requested_at, 'yyyy-MM-dd HH:mm:ssXXX'), // Ensure correct format for timestamp with timezone
      repair_activities: values.repair_activities, // Includi il nuovo campo
    };

    const { error } = await supabase
      .from('richieste_manutenzione')
      .update(payload)
      .eq('id', requestId);

    if (error) {
      showError(`Errore durante l'aggiornamento della richiesta: ${error.message}`);
      console.error("Error updating maintenance request:", error);
    } else {
      showSuccess("Richiesta di manutenzione aggiornata con successo!");
      onSaveSuccess();
    }
  };

  if (loadingInitialData) {
    return <div className="text-center py-8">Caricamento dati richiesta...</div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="service_point_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Punto Servizio</FormLabel>
                <Popover open={isServicePointSelectOpen} onOpenChange={setIsServicePointSelectOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={isServicePointSelectOpen}
                        className="w-full justify-between"
                      >
                        {field.value
                          ? puntiServizioList.find(point => point.id === field.value)?.nome_punto_servizio
                          : "Seleziona un punto servizio..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                      <CommandInput placeholder="Cerca punto servizio..." />
                      <CommandEmpty>Nessun punto servizio trovato.</CommandEmpty>
                      <CommandGroup>
                        {puntiServizioList.map((point) => (
                          <CommandItem
                            key={point.id}
                            value={point.nome_punto_servizio}
                            onSelect={() => {
                              form.setValue("service_point_id", point.id);
                              setIsServicePointSelectOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                field.value === point.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {point.nome_punto_servizio}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="vehicle_plate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Targa Veicolo</FormLabel>
                <FormControl>
                  <Input placeholder="Es: AB123CD" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="issue_description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrizione Problema</FormLabel>
              <FormControl>
                <Textarea placeholder="Descrivi il problema riscontrato..." rows={4} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="repair_activities" // Nuovo campo
          render={({ field }) => (
            <FormItem>
              <FormLabel>Attività di Riparazione</FormLabel>
              <FormControl>
                <Textarea placeholder="Descrivi le attività di riparazione effettuate..." rows={4} {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stato</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona stato" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Pending">In Attesa</SelectItem>
                    <SelectItem value="In Progress">In Corso</SelectItem>
                    <SelectItem value="Completed">Completato</SelectItem>
                    <SelectItem value="Cancelled">Annullato</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Priorità</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona priorità" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Low">Bassa</SelectItem>
                    <SelectItem value="Medium">Media</SelectItem>
                    <SelectItem value="High">Alta</SelectItem>
                    <SelectItem value="Urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="requested_by_employee_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Richiesto da</FormLabel>
                <Popover open={isEmployeeSelectOpen} onOpenChange={setIsEmployeeSelectOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={isEmployeeSelectOpen}
                        className="w-full justify-between"
                      >
                        {field.value
                          ? personaleList.find(emp => emp.id === field.value)?.nome + " " + personaleList.find(emp => emp.id === field.value)?.cognome
                          : "Seleziona dipendente..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                      <CommandInput placeholder="Cerca dipendente..." />
                      <CommandEmpty>Nessun dipendente trovato.</CommandEmpty>
                      <CommandGroup>
                        {personaleList.map((employee) => (
                          <CommandItem
                            key={employee.id}
                            value={`${employee.nome} ${employee.cognome || ''}`}
                            onSelect={() => {
                              form.setValue("requested_by_employee_id", employee.id);
                              setIsEmployeeSelectOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                field.value === employee.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {employee.nome} {employee.cognome}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="requested_at"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data Richiesta</FormLabel>
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
        <div className="flex justify-end gap-2 mt-6">
          <Button type="button" variant="outline" onClick={onCancel}>
            Annulla
          </Button>
          <Button type="submit">
            Salva Modifiche
          </Button>
        </div>
      </form>
    </Form>
  );
}