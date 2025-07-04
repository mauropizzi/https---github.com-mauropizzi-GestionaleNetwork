import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { supabase } from "@/integrations/supabase/client";
import { useAnagraficheData } from "@/hooks/use-anagrafiche-data"; // Import the new hook
import { OperatoreNetwork } from "@/lib/anagrafiche-data"; // Import OperatoreNetwork

interface OperatoriNetworkFormProps {
  operatore?: OperatoreNetwork; // Optional prop for editing
  onSaveSuccess?: () => void;
  onCancel?: () => void;
}

const formSchema = z.object({
  nome: z.string().min(2, "Il nome è richiesto."),
  cognome: z.string().optional().or(z.literal("")),
  clienteId: z.string().uuid("Seleziona un cliente valido.").optional().or(z.literal("")),
  telefono: z.string().optional().or(z.literal("")),
  email: z.string().email("Formato email non valido.").optional().or(z.literal("")),
});

export function OperatoriNetworkForm({ operatore, onSaveSuccess, onCancel }: OperatoriNetworkFormProps) {
  const { clienti, loading } = useAnagraficheData(); // Use the hook

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: operatore
      ? {
          nome: operatore.nome,
          cognome: operatore.cognome || "",
          clienteId: operatore.client_id || "",
          telefono: operatore.telefono || "",
          email: operatore.email || "",
        }
      : {
          nome: "",
          cognome: "",
          clienteId: "",
          telefono: "",
          email: "",
        },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const payload = {
      nome: values.nome,
      cognome: values.cognome || null,
      client_id: values.clienteId || null,
      telefono: values.telefono || null,
      email: values.email || null,
    };

    let result;
    if (operatore) {
      result = await supabase
        .from('operatori_network')
        .update(payload)
        .eq('id', operatore.id)
        .select();
    } else {
      result = await supabase
        .from('operatori_network')
        .insert([payload])
        .select();
    }

    if (result.error) {
      showError(`Errore durante la ${operatore ? 'modifica' : 'registrazione'} dell'operatore network: ${result.error.message}`);
      console.error(`Error ${operatore ? 'updating' : 'inserting'} operatore network:`, result.error);
    } else {
      showSuccess(`Operatore Network ${operatore ? 'modificato' : 'salvato'} con successo!`);
      console.log("Operatore Network Data:", result.data);
      form.reset(); // Reset form after submission
      onSaveSuccess?.();
    }
  };

  if (loading) {
    return <div>Caricamento dati anagrafici...</div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <h3 className="text-lg font-semibold">{operatore ? "Modifica Dettagli Operatore Network" : "Dettagli Operatore Network"}</h3>
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
          name="clienteId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cliente Associato (Opzionale)</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(value === "DYAD_EMPTY_VALUE" ? "" : value)}
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
                  <Input placeholder="Telefono" {...field} />
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
                  <Input type="email" placeholder="email@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex justify-end gap-2">
          {operatore && onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Annulla
            </Button>
          )}
          <Button type="submit" className="w-full">
            {operatore ? "Salva Modifiche" : "Salva Operatore Network"}
          </Button>
        </div>
      </form>
    </Form>
  );
}