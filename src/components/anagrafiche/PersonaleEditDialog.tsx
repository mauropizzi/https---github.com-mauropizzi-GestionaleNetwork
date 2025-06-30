import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { format, parseISO, isValid } from 'date-fns';
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
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { showSuccess, showError } from "@/utils/toast";
import { supabase } from '@/integrations/supabase/client';
import { Personale } from '@/lib/anagrafiche-data';

interface PersonaleEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  personale: Personale | null;
  onSave: (updatedPersonale: Personale) => void;
}

const formSchema = z.object({
  nome: z.string().min(2, "Il nome è richiesto."),
  cognome: z.string().min(2, "Il cognome è richiesto."),
  codice_fiscale: z.string().optional().nullable(),
  ruolo: z.enum(["Pattuglia", "Operatore Network", "GPG", "Operatore C.O."], {
    required_error: "Seleziona un ruolo.",
  }),
  telefono: z.string().optional().nullable(),
  email: z.string().email("Formato email non valido.").optional().nullable().or(z.literal("")),
  data_nascita: z.date().optional().nullable(),
  luogo_nascita: z.string().optional().nullable(),
  indirizzo: z.string().optional().nullable(),
  cap: z.string().optional().nullable(),
  citta: z.string().optional().nullable(),
  provincia: z.string().optional().nullable(),
  data_assunzione: z.date().optional().nullable(),
  data_cessazione: z.date().optional().nullable(),
  attivo: z.boolean().default(true).optional(),
  note: z.string().optional().nullable(),
});

export function PersonaleEditDialog({ isOpen, onClose, personale, onSave }: PersonaleEditDialogProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
      cognome: "",
      codice_fiscale: null,
      ruolo: "Pattuglia", // Default to a new valid role
      telefono: null,
      email: null,
      data_nascita: null,
      luogo_nascita: null,
      indirizzo: null,
      cap: null,
      citta: null,
      provincia: null,
      data_assunzione: null,
      data_cessazione: null,
      attivo: true,
      note: null,
    },
  });

  useEffect(() => {
    if (personale) {
      const mapOldRoleToNew = (oldRole: string | undefined): "Pattuglia" | "Operatore Network" | "GPG" | "Operatore C.O." => {
        switch (oldRole) {
          case "guardia_giurata":
            return "GPG";
          case "operatore_fiduciario":
            return "Operatore Network";
          case "amministrativo":
            return "Operatore C.O.";
          case "Pattuglia":
          case "Operatore Network":
          case "GPG":
          case "Operatore C.O.":
            return oldRole; // If it's already one of the new valid roles
          default:
            return "Pattuglia"; // Default to a valid new role if no match
        }
      };

      form.reset({
        nome: personale.nome,
        cognome: personale.cognome,
        codice_fiscale: personale.codice_fiscale || null,
        ruolo: mapOldRoleToNew(personale.ruolo),
        telefono: personale.telefono || null,
        email: personale.email || null,
        data_nascita: personale.data_nascita ? parseISO(personale.data_nascita) : null,
        luogo_nascita: personale.luogo_nascita || null,
        indirizzo: personale.indirizzo || null,
        cap: personale.cap || null,
        citta: personale.citta || null,
        provincia: personale.provincia || null,
        data_assunzione: personale.data_assunzione ? parseISO(personale.data_assunzione) : null,
        data_cessazione: personale.data_cessazione ? parseISO(personale.data_cessazione) : null,
        attivo: personale.attivo ?? true,
        note: personale.note || null,
      });
    }
  }, [personale, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!personale) {
      showError("Nessun personale selezionato per la modifica.");
      onClose();
      return;
    }

    const updatedData = {
      nome: values.nome,
      cognome: values.cognome,
      codice_fiscale: values.codice_fiscale,
      ruolo: values.ruolo,
      telefono: values.telefono,
      email: values.email,
      data_nascita: values.data_nascita ? format(values.data_nascita, 'yyyy-MM-dd') : null,
      luogo_nascita: values.luogo_nascita,
      indirizzo: values.indirizzo,
      cap: values.cap,
      citta: values.citta,
      provincia: values.provincia,
      data_assunzione: values.data_assunzione ? format(values.data_assunzione, 'yyyy-MM-dd') : null,
      data_cessazione: values.data_cessazione ? format(values.data_cessazione, 'yyyy-MM-dd') : null,
      attivo: values.attivo,
      note: values.note,
    };

    const { data, error } = await supabase
      .from('personale')
      .update(updatedData)
      .eq('id', personale.id)
      .select();

    if (error) {
      showError(`Errore durante l'aggiornamento del personale: ${error.message}`);
      console.error("Error updating personale:", error);
    } else {
      showSuccess(`Personale ${personale.nome} ${personale.cognome} aggiornato con successo!`);
      onSave({ ...personale, ...updatedData });
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifica Personale: {personale?.nome} {personale?.cognome}</DialogTitle>
          <DialogDescription>
            Apporta modifiche ai dettagli del personale.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cognome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cognome</FormLabel>
                    <FormControl>
                      <Input placeholder="Cognome" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="codice_fiscale"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Codice Fiscale</FormLabel>
                  <FormControl>
                    <Input placeholder="Codice Fiscale" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="ruolo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ruolo</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona un ruolo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Pattuglia">Pattuglia</SelectItem>
                      <SelectItem value="Operatore Network">Operatore Network</SelectItem>
                      <SelectItem value="GPG">GPG</SelectItem>
                      <SelectItem value="Operatore C.O.">Operatore C.O.</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="telefono"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefono</FormLabel>
                    <FormControl>
                      <Input placeholder="Telefono" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="email@example.com" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="data_nascita"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data di Nascita</FormLabel>
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
                            <span className="flex items-center justify-between w-full">
                              {field.value ? (
                                format(field.value, "PPP", { locale: it })
                              ) : (
                                <span>Seleziona una data</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </span>
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
                name="luogo_nascita"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Luogo di Nascita</FormLabel>
                    <FormControl>
                      <Input placeholder="Luogo di Nascita" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="indirizzo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Indirizzo</FormLabel>
                  <FormControl>
                    <Input placeholder="Via, numero civico" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="citta"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Città</FormLabel>
                    <FormControl>
                      <Input placeholder="Città" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cap"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CAP</FormLabel>
                    <FormControl>
                      <Input placeholder="CAP" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="provincia"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Provincia</FormLabel>
                    <FormControl>
                      <Input placeholder="Provincia" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="data_assunzione"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data di Assunzione</FormLabel>
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
                            <span className="flex items-center justify-between w-full">
                              {field.value ? (
                                format(field.value, "PPP", { locale: it })
                              ) : (
                                <span>Seleziona una data</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </span>
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
                name="data_cessazione"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data di Cessazione</FormLabel>
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
                            <span className="flex items-center justify-between w-full">
                              {field.value ? (
                                format(field.value, "PPP", { locale: it })
                              ) : (
                                <span>Seleziona una data</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </span>
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
                      Personale Attivo
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
                    <Textarea placeholder="Note sul personale..." {...field} />
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