import React, { useEffect, useRef, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { showSuccess, showError } from "@/utils/toast";
import { supabase } from '@/integrations/supabase/client';
import {
  servicePointsData,
  requestTypeOptions,
  coOperatorOptions,
  operatorClientOptions,
  gpgInterventionOptions,
  serviceOutcomeOptions,
} from '@/lib/centrale-data';

interface AllarmeIntervento {
  id: string;
  report_date: string; // ISO date string
  report_time: string; // HH:MM:SS string
  service_point_code: string;
  request_type: string;
  co_operator?: string;
  operator_client?: string;
  gpg_intervention?: string;
  service_outcome?: string; // This should be null for "in progress"
  notes?: string;
  latitude?: number;
  longitude?: number;
}

interface EditInterventionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  event: AllarmeIntervento | null;
  onSave: (updatedEvent: AllarmeIntervento) => void;
}

const formSchema = z.object({
  id: z.string().uuid(), // ID is required for update
  report_date: z.string().min(1, "La data del rapporto è richiesta."),
  report_time: z.string().min(1, "L'ora del rapporto è richiesta."), // Simplified validation
  service_point_code: z.string().min(1, "Il punto servizio è richiesto."),
  request_type: z.string().min(1, "Il tipo di richiesta è richiesto."),
  co_operator: z.string().optional().or(z.literal("")),
  operator_client: z.string().optional().or(z.literal("")),
  gpg_intervention: z.string().optional().or(z.literal("")),
  service_outcome: z.string().nullish(), // Allows string, null, or undefined
  notes: z.string().optional().or(z.literal("")),
  latitude: z.coerce.number().optional().nullable(),
  longitude: z.coerce.number().optional().nullable(),
});

export const EditInterventionDialog = React.memo(({ isOpen, onClose, event, onSave }: EditInterventionDialogProps) => {
  const defaultValues = useMemo(() => ({
    id: event?.id || '',
    report_date: event?.report_date || '',
    report_time: event?.report_time || '',
    service_point_code: event?.service_point_code || '',
    request_type: event?.request_type || '',
    co_operator: event?.co_operator ?? "",
    operator_client: event?.operator_client ?? "",
    gpg_intervention: event?.gpg_intervention ?? "",
    service_outcome: event?.service_outcome ?? null,
    notes: event?.notes ?? "",
    latitude: event?.latitude ?? undefined,
    longitude: event?.longitude ?? undefined,
  }), [event]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues,
  });

  // Reset form values when the dialog opens with a new event or closes
  useEffect(() => {
    if (isOpen && event) {
      form.reset(defaultValues);
    } else if (!isOpen) {
      form.reset(); // Reset to empty when dialog closes
    }
  }, [isOpen, event, form, defaultValues]);


  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!event) {
      showError("Nessun evento selezionato per la modifica.");
      return;
    }

    const payload = {
      report_date: values.report_date,
      report_time: values.report_time,
      service_point_code: values.service_point_code,
      request_type: values.request_type,
      co_operator: values.co_operator || null,
      operator_client: values.operator_client || null,
      gpg_intervention: values.gpg_intervention || null,
      service_outcome: values.service_outcome || null,
      notes: values.notes || null,
      latitude: values.latitude || null,
      longitude: values.longitude || null,
    };

    const { data, error } = await supabase
      .from('allarme_interventi')
      .update(payload)
      .eq('id', values.id)
      .select();

    if (error) {
      showError(`Errore durante l'aggiornamento dell'evento: ${error.message}`);
      console.error("Error updating alarm event:", error);
    } else {
      showSuccess(`Evento ${values.id} aggiornato con successo!`);
      if (data && data.length > 0) {
        onSave(data[0] as AllarmeIntervento);
      }
      onClose();
    }
  };

  if (!event) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifica Evento Allarme: {event.id}</DialogTitle>
          <DialogDescription>
            Apporta modifiche ai dettagli dell'evento.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
            <FormField
              control={form.control}
              name="report_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data Rapporto</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="report_time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ora Rapporto (HH:MM:SS)</FormLabel>
                  <FormControl>
                    <Input type="text" placeholder="HH:MM:SS" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="service_point_code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Punto Servizio</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona un punto servizio..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {servicePointsData.map(point => (
                        <SelectItem key={point.code} value={point.code}>
                          {point.name}
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
              name="request_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipologia Richiesta</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona tipologia..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {requestTypeOptions.map(option => (
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
            <FormField
              control={form.control}
              name="co_operator"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Operatore C.O.</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value === "__EMPTY_SELECTION__" ? "" : value)}
                    value={field.value === "" ? "__EMPTY_SELECTION__" : field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona operatore..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="__EMPTY_SELECTION__">Nessuno</SelectItem>
                      {coOperatorOptions.map(option => (
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
            <FormField
              control={form.control}
              name="operator_client"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Operatore Cliente</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value === "__EMPTY_SELECTION__" ? "" : value)}
                    value={field.value === "" ? "__EMPTY_SELECTION__" : field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona operatore cliente..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="__EMPTY_SELECTION__">Nessuno</SelectItem>
                      {operatorClientOptions.map(option => (
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
            <FormField
              control={form.control}
              name="gpg_intervention"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>G.P.G. Intervento</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value === "__EMPTY_SELECTION__" ? "" : value)}
                    value={field.value === "" ? "__EMPTY_SELECTION__" : field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona G.P.G. intervento..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="__EMPTY_SELECTION__">Nessuno</SelectItem>
                      {gpgInterventionOptions.map(option => (
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
            <FormField
              control={form.control}
              name="service_outcome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Esito Servizio</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value === "NULL_OUTCOME" ? null : value)}
                    value={field.value === null ? "NULL_OUTCOME" : field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona esito..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="NULL_OUTCOME">Nessun Esito (In Gestione)</SelectItem>
                      {serviceOutcomeOptions.map(option => (
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="latitude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Latitudine</FormLabel>
                    <FormControl>
                      <Input type="number" step="any" placeholder="Es: 38.123456" {...field} onChange={e => field.onChange(e.target.valueAsNumber)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="longitude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Longitudine</FormLabel>
                    <FormControl>
                      <Input type="number" step="any" placeholder="Es: 13.123456" {...field} onChange={e => field.onChange(e.target.valueAsNumber)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="submit">Salva Modifiche</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
});

EditInterventionDialog.displayName = 'EditInterventionDialog';