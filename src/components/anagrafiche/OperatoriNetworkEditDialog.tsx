import React, { useEffect, useState } from 'react';
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
import { showSuccess, showError } from "@/utils/toast";
import { supabase } from '@/integrations/supabase/client';
import { OperatoreNetwork, Cliente } from '@/lib/anagrafiche-data';
import { fetchClienti } from '@/lib/data-fetching';

interface OperatoreNetworkEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  operatore: OperatoreNetwork | null;
  onSave: (updatedOperatore: OperatoreNetwork) => void;
}

const formSchema = z.object({
  nome: z.string().min(2, "Il nome è richiesto."),
  cognome: z.string().optional().nullable(),
  clienteId: z.string().uuid("Seleziona un cliente valido.").optional().nullable(),
  telefono: z.string().optional().nullable(),
  email: z.string().email("Formato email non valido.").optional().nullable().or(z.literal("")),
});

export function OperatoreNetworkEditDialog({ isOpen, onClose, operatore, onSave }: OperatoreNetworkEditDialogProps) {
  const [clienti, setClienti] = useState<Cliente[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
      cognome: null,
      clienteId: null,
      telefono: null,
      email: null,
    },
  });

  useEffect(() => {
    const loadClienti = async () => {
      const fetchedClienti = await fetchClienti();
      setClienti(fetchedClienti);
    };
    loadClienti();
  }, []);

  useEffect(() => {
    if (operatore) {
      form.reset({
        nome: operatore.nome,
        cognome: operatore.cognome || null,
        clienteId: operatore.client_id || null,
        telefono: operatore.telefono || null,
        email: operatore.email || null,
      });
    }
  }, [operatore, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!operatore) {
      showError("Nessun operatore network selezionato per la modifica.");
      onClose();
      return;
    }

    const updatedData = {
      nome: values.nome,
      cognome: values.cognome,
      client_id: values.clienteId,
      telefono: values.telefono,
      email: values.email,
    };

    const { data, error } = await supabase
      .from('operatori_network')
      .update(updatedData)
      .eq('id', operatore.id)
      .select();

    if (error) {
      showError(`Errore durante l'aggiornamento dell'operatore network: ${error.message}`);
      console.error("Error updating operatore network:", error);
    } else {
      showSuccess(`Operatore Network "${operatore.nome} ${operatore.cognome || ''}" aggiornato con successo!`);
      onSave({ ...operatore, ...updatedData });
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifica Operatore Network: {operatore?.nome} {operatore?.cognome}</DialogTitle>
          <DialogDescription>
            Apporta modifiche ai dettagli dell'operatore network.
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
                      <Input placeholder="Cognome" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="clienteId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cliente Associato (Opzionale)</FormLabel>
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
                      <SelectItem value="DYAD_EMPTY_VALUE">Nessun Cliente Associato</SelectItem>
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
            <DialogFooter>
              <Button type="submit">Salva Modifiche</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}