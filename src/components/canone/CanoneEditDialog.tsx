import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { format, parseISO, isValid } from 'date-fns';
import { it } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
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
import { supabase } from '@/integrations/supabase/client';
import { ServiziCanone, PuntoServizio, Fornitore } from '@/lib/anagrafiche-data';
import { fetchPuntiServizio, fetchFornitori, calculateServiceCost } from '@/lib/data-fetching';

interface CanoneEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  canone: ServiziCanone | null;
  onSave: (updatedCanone: ServiziCanone) => void;
}

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
  fornitoreId: z.string().uuid("Seleziona un fornitore valido.").optional().nullable(),
  tipoCanone: z.string().min(1, "Il tipo di canone è richiesto."),
  startDate: z.date({
    required_error: "La data di inizio è richiesta.",
  }),
  endDate: z.date().optional().nullable(),
  status: z.enum(["Attivo", "Inattivo", "Sospeso"], {
    required_error: "Seleziona uno stato.",
  }).default("Attivo"),
  notes: z.string().optional().nullable(),
}); // Removed .refine from here

export function CanoneEditDialog({ isOpen, onClose, canone, onSave }: CanoneEditDialogProps) {
  const [puntiServizio, setPuntiServizio] = useState<PuntoServizio[]>([]);
  const [fornitori, setFornitori] = useState<Fornitore[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      servicePointId: "",
      fornitoreId: null,
      tipoCanone: "",
      startDate: new Date(),
      endDate: null,
      status: "Attivo",
      notes: null,
    },
  });

  useEffect(() => {
    const loadData = async () => {
      const fetchedPuntiServizio = await fetchPuntiServizio();
      const fetchedFornitori = await fetchFornitori();
      setPuntiServizio(fetchedPuntiServizio);
      setFornitori(fetchedFornitori);
    };
    loadData();
  }, []);

  useEffect(() => {
    if (canone) {
      form.reset({
        servicePointId: canone.service_point_id,
        fornitoreId: canone.fornitore_id || null,
        tipoCanone: canone.tipo_canone,
        startDate: (canone.start_date && typeof canone.start_date === 'string') ? parseISO(canone.start_date) : new Date(),
        endDate: (canone.end_date && typeof canone.end_date === 'string') ? parseISO(canone.end_date) : null,
        status: canone.status,
        notes: canone.notes || null,
      });
    }
  }, [canone, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!canone) {
      showError("Nessun servizio a canone selezionato per la modifica.");
      onClose();
      return;
    }

    // Manual date validation
    if (values.startDate && values.endDate && values.endDate < values.startDate) {
      form.setError("endDate", {
        type: "manual",
        message: "La data di fine non può essere precedente alla data di inizio.",
      });
      showError("La data di fine non può essere precedente alla data di inizio.");
      return;
    }

    const selectedServicePoint = puntiServizio.find(p => p.id === values.servicePointId);
    const clientId = selectedServicePoint?.id_cliente || null;

    if (!clientId) {
      showError("Impossibile determinare il cliente associato al punto servizio.");
      return;
    }

    const costDetails = {
      type: values.tipoCanone,
      client_id: clientId,
      service_point_id: values.servicePointId,
      fornitore_id: values.fornitoreId,
      start_date: values.startDate,
      end_date: values.endDate || values.startDate,
      start_time: null,
      end_time: null,
      num_agents: null,
      cadence_hours: null,
      daily_hours_config: null,
      inspection_type: null,
    };

    const calculatedCostResult = await calculateServiceCost(costDetails);
    const calculatedCost = calculatedCostResult ? (calculatedCostResult.multiplier * calculatedCostResult.clientRate) : null;
    const unitaMisura = calculatedCostResult ? "mese" : null;

    const updatedData = {
      service_point_id: values.servicePointId,
      fornitore_id: values.fornitoreId,
      tipo_canone: values.tipoCanone,
      start_date: format(values.startDate, 'yyyy-MM-dd'),
      end_date: values.endDate ? format(values.endDate, 'yyyy-MM-dd') : null,
      status: values.status,
      notes: values.notes,
      calculated_cost: calculatedCost,
      client_id: clientId,
      unita_misura: unitaMisura,
    };

    const { data, error } = await supabase
      .from('servizi_canone')
      .update(updatedData)
      .eq('id', canone.id)
      .select();

    if (error) {
      showError(`Errore durante l'aggiornamento del servizio a canone: ${error.message}`);
      console.error("Error updating servizi_canone:", error);
    } else {
      showSuccess(`Servizio a canone "${canone.tipo_canone}" aggiornato con successo!`);
      onSave({ ...canone, ...updatedData });
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifica Servizio a Canone: {canone?.tipo_canone}</DialogTitle>
          <DialogDescription>
            Apporta modifiche ai dettagli del servizio a canone.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
            <FormField
              control={form.control}
              name="servicePointId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Punto Servizio *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
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
                    onValueChange={(value) => field.onChange(value === "DYAD_EMPTY_VALUE" ? null : value)}
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
                  <Select onValueChange={field.onChange} value={field.value}>
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
                    <Textarea placeholder="Note aggiuntive..." {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">Salva Modifiche</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}