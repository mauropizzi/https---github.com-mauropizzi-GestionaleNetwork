import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { format, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
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
import { cn } from "@/lib/utils";
import { showSuccess, showError } from "@/utils/toast";
import { supabase } from '@/integrations/supabase/client';
import { Cliente, PuntoServizio, Fornitore, serviceTypeRateOptions } from '@/lib/anagrafiche-data';
import { fetchClienti, fetchPuntiServizio, fetchFornitori } from '@/lib/data-fetching';

interface Tariffa {
  id: string;
  created_at: string;
  client_id: string;
  service_type: string;
  client_rate: number;
  supplier_rate: number;
  unita_misura: string;
  punto_servizio_id?: string | null;
  fornitore_id?: string | null;
  data_inizio_validita?: string | null;
  data_fine_validita?: string | null;
  note?: string | null;
  // Joined fields (not part of form schema, but useful for display)
  nome_cliente?: string;
  nome_punto_servizio?: string;
  nome_fornitore?: string;
}

interface TariffaEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  tariffa: Tariffa | null;
  onSave: (updatedTariffa: Tariffa) => void;
}

const unitaMisuraOptions = ["ora", "intervento", "km", "mese"];

const formSchema = z.object({
  client_id: z.string().uuid("Seleziona un cliente valido.").nonempty("Il cliente è richiesto."),
  service_type: z.string().min(1, "Il tipo di servizio è richiesto."),
  client_rate: z.coerce.number().min(0.01, "L'importo deve essere un numero positivo."),
  supplier_rate: z.coerce.number().min(0.01, "La tariffa fornitore deve essere un numero positivo."),
  unita_misura: z.string().min(1, "L'unità di misura è richiesta."),
  punto_servizio_id: z.string().uuid("Seleziona un punto servizio valido.").optional().nullable(),
  fornitore_id: z.string().uuid("Seleziona un fornitore valido.").optional().nullable(),
  data_inizio_validita: z.date().optional().nullable(),
  data_fine_validita: z.date().optional().nullable(),
  note: z.string().optional().nullable(),
}).refine(data => {
  if (data.data_inizio_validita && data.data_fine_validita) {
    return data.data_fine_validita >= data.data_inizio_validita;
  }
  return true;
}, {
  message: "La data di fine validità non può essere precedente alla data di inizio.",
  path: ["data_fine_validita"],
});

export function TariffaEditDialog({ isOpen, onClose, tariffa, onSave }: TariffaEditDialogProps) {
  const [clienti, setClienti] = useState<Cliente[]>([]);
  const [puntiServizio, setPuntiServizio] = useState<PuntoServizio[]>([]);
  const [fornitori, setFornitori] = useState<Fornitore[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      client_id: "",
      service_type: "",
      client_rate: 0,
      supplier_rate: 0,
      unita_misura: "",
      punto_servizio_id: null,
      fornitore_id: null,
      data_inizio_validita: null,
      data_fine_validita: null,
      note: null,
    },
  });

  useEffect(() => {
    const loadData = async () => {
      const fetchedClienti = await fetchClienti();
      const fetchedPuntiServizio = await fetchPuntiServizio();
      const fetchedFornitori = await fetchFornitori();
      setClienti(fetchedClienti);
      setPuntiServizio(fetchedPuntiServizio);
      setFornitori(fetchedFornitori);
    };
    loadData();
  }, []);

  useEffect(() => {
    if (tariffa) {
      form.reset({
        client_id: tariffa.client_id,
        service_type: tariffa.service_type,
        client_rate: tariffa.client_rate,
        supplier_rate: tariffa.supplier_rate,
        unita_misura: tariffa.unita_misura,
        punto_servizio_id: tariffa.punto_servizio_id || null,
        fornitore_id: tariffa.fornitore_id || null,
        data_inizio_validita: tariffa.data_inizio_validita ? parseISO(tariffa.data_inizio_validita) : null,
        data_fine_validita: tariffa.data_fine_validita ? parseISO(tariffa.data_fine_validita) : null,
        note: tariffa.note || null,
      });
    }
  }, [tariffa, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!tariffa) {
      showError("Nessuna tariffa selezionata per la modifica.");
      onClose();
      return;
    }

    const updatedData = {
      client_id: values.client_id,
      service_type: values.service_type,
      client_rate: values.client_rate,
      supplier_rate: values.supplier_rate,
      unita_misura: values.unita_misura,
      punto_servizio_id: values.punto_servizio_id,
      fornitore_id: values.fornitore_id,
      data_inizio_validita: values.data_inizio_validita ? format(values.data_inizio_validita, 'yyyy-MM-dd') : null,
      data_fine_validita: values.data_fine_validita ? format(values.data_fine_validita, 'yyyy-MM-dd') : null,
      note: values.note,
    };

    const { data, error } = await supabase
      .from('tariffe')
      .update(updatedData)
      .eq('id', tariffa.id)
      .select();

    if (error) {
      showError(`Errore durante l'aggiornamento della tariffa: ${error.message}`);
      console.error("Error updating tariffa:", error);
    } else {
      showSuccess(`Tariffa "${tariffa.service_type}" aggiornata con successo!`);
      onSave({ ...tariffa, ...updatedData });
    }
    onClose();
  };

  const tipoServizio = form.watch("service_type");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifica Tariffa: {tariffa?.service_type}</DialogTitle>
          <DialogDescription>
            Apporta modifiche ai dettagli della tariffa.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
            <FormField
              control={form.control}
              name="client_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cliente</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value === "DYAD_EMPTY_VALUE" ? null : value)}
                    value={field.value || "DYAD_EMPTY_VALUE"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona un cliente" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="DYAD_EMPTY_VALUE">Seleziona un cliente</SelectItem>
                      {clienti.map((cliente) => (
                        <SelectItem key={cliente.id} value={cliente.id}>
                          {cliente.nome_cliente}
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
              name="service_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo di Servizio</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona tipo di servizio" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {serviceTypeRateOptions.map((option) => (
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
                name="client_rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Importo Cliente (€)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} onChange={e => field.onChange(e.target.valueAsNumber)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="supplier_rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Importo Fornitore (€)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} onChange={e => field.onChange(e.target.valueAsNumber)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="unita_misura"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unità di Misura</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={!!tipoServizio && (tipoServizio === "Piantonamento" || tipoServizio === "Servizi Fiduciari" || tipoServizio === "Ispezioni" || tipoServizio === "Bonifiche" || tipoServizio === "Gestione Chiavi" || tipoServizio === "Apertura/Chiusura" || tipoServizio === "Intervento")}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona unità di misura" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {unitaMisuraOptions.map((option) => (
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
              name="punto_servizio_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Punto Servizio Associato (Opzionale)</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value === "DYAD_EMPTY_VALUE" ? null : value)}
                    value={field.value || "DYAD_EMPTY_VALUE"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona un punto servizio" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="DYAD_EMPTY_VALUE">Nessun Punto Servizio Specifico</SelectItem>
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
              name="fornitore_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fornitore Associato (Opzionale)</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value === "DYAD_EMPTY_VALUE" ? null : value)}
                    value={field.value || "DYAD_EMPTY_VALUE"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona un fornitore" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="DYAD_EMPTY_VALUE">Nessun Fornitore Specifico</SelectItem>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="data_inizio_validita"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data Inizio Validità</FormLabel>
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
              <FormField
                control={form.control}
                name="data_fine_validita"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data Fine Validità</FormLabel>
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
            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Note Aggiuntive</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Note sulla tariffa..." {...field} value={field.value || ''} />
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