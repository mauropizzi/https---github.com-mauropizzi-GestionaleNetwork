import React, { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { ServiceReport } from "@/lib/anagrafiche-data";

const dotazioniFormSchema = z.object({
  report_date: z.date({ required_error: "La data del report è richiesta." }),
  report_time: z.string().min(1, "L'ora del report è richiesta."),
  client_id: z.string().min(1, "Il cliente è richiesto."),
  site_name: z.string().min(1, "Il nome del cantiere è richiesto."),
  employee_id: z.string().min(1, "L'addetto è richiesto."),
  service_provided: z.string().min(1, "Il servizio fornito è richiesto."),
  automezzi_used: z.boolean().default(false),
  automezzi_details: z.string().optional(),
  attrezzi_used: z.boolean().default(false),
  attrezzi_details: z.string().optional(),
  notes: z.string().optional(),
});

type DotazioniFormValues = z.infer<typeof dotazioniFormSchema>;

interface ServiceReportFormProps {
  report?: ServiceReport;
  onSaveSuccess: () => void;
  onCancel: () => void;
}

export function ServiceReportForm({ report, onSaveSuccess, onCancel }: ServiceReportFormProps) {
  const [clients, setClients] = useState<{ id: string; nome_cliente: string }[]>([]);
  const [employees, setEmployees] = useState<{ id: string; nome: string; cognome: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const form = useForm<DotazioniFormValues>({
    resolver: zodResolver(dotazioniFormSchema),
    defaultValues: report
      ? {
          ...report,
          report_date: new Date(report.report_date),
          automezzi_used: report.automezzi_used || false,
          attrezzi_used: report.attrezzi_used || false,
        }
      : {
          report_date: new Date(),
          report_time: format(new Date(), "HH:mm"),
          automezzi_used: false,
          automezzi_details: "",
          attrezzi_used: false,
          attrezzi_details: "",
          notes: "",
        },
  });

  const fetchDependencies = useCallback(async () => {
    setLoading(true);
    const { data: clientsData, error: clientsError } = await supabase
      .from('clienti')
      .select('id, nome_cliente');
    if (clientsError) {
      showError(`Errore nel recupero clienti: ${clientsError.message}`);
      console.error("Error fetching clients:", clientsError);
    } else {
      setClients(clientsData || []);
    }

    const { data: employeesData, error: employeesError } = await supabase
      .from('operatori_network')
      .select('id, nome, cognome');
    if (employeesError) {
      showError(`Errore nel recupero operatori: ${employeesError.message}`);
      console.error("Error fetching employees:", employeesError);
    } else {
      setEmployees(employeesData || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchDependencies();
  }, [fetchDependencies]);

  const onSubmit = async (values: DotazioniFormValues) => {
    const formattedValues = {
      ...values,
      report_date: format(values.report_date, "yyyy-MM-dd"),
    };

    let error = null;
    if (report) {
      const { error: updateError } = await supabase
        .from('cantiere_reports')
        .update(formattedValues)
        .eq('id', report.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from('cantiere_reports')
        .insert(formattedValues);
      error = insertError;
    }

    if (error) {
      showError(`Errore nel salvataggio del report: ${error.message}`);
      console.error("Error saving report:", error);
    } else {
      showSuccess("Report salvato con successo!");
      onSaveSuccess();
    }
  };

  if (loading) {
    return <div>Caricamento dati...</div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="report_date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Data Report</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-[240px] pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
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
                    disabled={(date) =>
                      date > new Date() || date < new Date("1900-01-01")
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="report_time"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ora Report</FormLabel>
              <FormControl>
                <Input type="time" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="client_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cliente</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona un cliente" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.nome_cliente}
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
          name="site_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome Cantiere</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="employee_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Addetto</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona un addetto" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {`${employee.nome} ${employee.cognome}`}
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
          name="service_provided"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Servizio Fornito</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="automezzi_used"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Automezzi Utilizzati</FormLabel>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
        {form.watch("automezzi_used") && (
          <FormField
            control={form.control}
            name="automezzi_details"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dettagli Automezzi</FormLabel>
                <FormControl>
                  <Textarea {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <FormField
          control={form.control}
          name="attrezzi_used"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Attrezzi Utilizzati</FormLabel>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
        {form.watch("attrezzi_used") && (
          <FormField
            control={form.control}
            name="attrezzi_details"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dettagli Attrezzi</FormLabel>
                <FormControl>
                  <Textarea {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Note</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Annulla
          </Button>
          <Button type="submit">Salva Report</Button>
        </div>
      </form>
    </Form>
  );
}