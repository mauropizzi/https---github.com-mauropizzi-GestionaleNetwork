import React, { useEffect } from 'react';
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
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { showSuccess, showError } from "@/utils/toast";
import { supabase } from '@/integrations/supabase/client';
import { Procedure } from '@/lib/anagrafiche-data';

interface ProcedureEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  procedure: Procedure | null;
  onSave: (updatedProcedure: Procedure) => void;
}

const formSchema = z.object({
  nome_procedura: z.string().min(2, "Il nome della procedura è richiesto."),
  descrizione: z.string().optional().nullable(),
  versione: z.string().optional().nullable(),
  data_ultima_revisione: z.date().optional().nullable(),
  responsabile: z.string().optional().nullable(),
  documento_url: z.string().url("Formato URL non valido.").optional().nullable().or(z.literal("")),
  attivo: z.boolean().default(true).optional(),
  note: z.string().optional().nullable(),
});

export function ProcedureEditDialog({ isOpen, onClose, procedure, onSave }: ProcedureEditDialogProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome_procedura: "",
      descrizione: null,
      versione: null,
      data_ultima_revisione: null,
      responsabile: null,
      documento_url: null,
      attivo: true,
      note: null,
    },
  });

  useEffect(() => {
    if (procedure) {
      form.reset({
        nome_procedura: procedure.nome_procedura,
        descrizione: procedure.descrizione || null,
        versione: procedure.versione || null,
        data_ultima_revisione: procedure.data_ultima_revisione ? parseISO(procedure.data_ultima_revisione) : null,
        responsabile: procedure.responsabile || null,
        documento_url: procedure.documento_url || null,
        attivo: procedure.attivo ?? true,
        note: procedure.note || null,
      });
    }
  }, [procedure, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!procedure) {
      showError("Nessuna procedura selezionata per la modifica.");
      onClose();
      return;
    }

    const updatedData = {
      nome_procedura: values.nome_procedura,
      descrizione: values.descrizione,
      versione: values.versione,
      data_ultima_revisione: values.data_ultima_revisione ? format(values.data_ultima_revisione, 'yyyy-MM-dd') : null,
      responsabile: values.responsabile,
      documento_url: values.documento_url,
      attivo: values.attivo,
      note: values.note,
    };

    const { data, error } = await supabase
      .from('procedure')
      .update(updatedData)
      .eq('id', procedure.id)
      .select();

    if (error) {
      showError(`Errore durante l'aggiornamento della procedura: ${error.message}`);
      console.error("Error updating procedure:", error);
    } else {
      showSuccess(`Procedura "${procedure.nome_procedura}" aggiornata con successo!`);
      onSave({ ...procedure, ...updatedData });
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifica Procedura: {procedure?.nome_procedura}</DialogTitle>
          <DialogDescription>
            Apporta modifiche ai dettagli della procedura.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
            <FormField
              control={form.control}
              name="nome_procedura"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Procedura</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome della procedura" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="descrizione"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrizione</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Descrizione dettagliata della procedura..." rows={3} {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="versione"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Versione</FormLabel>
                    <FormControl>
                      <Input placeholder="Es: 1.0" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="data_ultima_revisione"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data Ultima Revisione</FormLabel>
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
              name="responsabile"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Responsabile</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome del responsabile" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="documento_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL Documento (Opzionale)</FormLabel>
                  <FormControl>
                    <Input type="url" placeholder="https://esempio.com/documento.pdf" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="attivo"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Procedura Attiva
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Note Aggiuntive</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Note sulla procedura..." rows={3} {...field} value={field.value || ''} />
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