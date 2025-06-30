import React, { useState, useEffect } from "react";
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
import { Cliente } from "@/lib/anagrafiche-data";
import { fetchClienti } from "@/lib/data-fetching";

const formSchema = z.object({
  nome: z.string().min(2, "Il nome è richiesto."),
  cognome: z.string().optional().or(z.literal("")),
  clienteId: z.string().uuid("Seleziona un cliente valido.").optional().or(z.literal("")),
  telefono: z.string().optional().or(z.literal("")),
  email: z.string().email("Formato email non valido.").optional().or(z.literal("")),
});

export function OperatoriNetworkForm() {
  const [clienti, setClienti] = useState<Cliente[]>([]);

  useEffect(() => {
    const loadClienti = async () => {
      const fetchedClienti = await fetchClienti();
      setClienti(fetchedClienti);
    };
    loadClienti();
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
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

    const { data, error } = await supabase
      .from('operatori_network')
      .insert([payload])
      .select();

    if (error) {
      showError(`Errore durante la registrazione dell'operatore network: ${error.message}`);
      console.error("Error inserting operatore network:", error);
    } else {
      showSuccess("Operatore Network salvato con successo!");
      console.log("Operatore Network Data:", data);
      form.reset(); // Reset form after submission
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <h3 className="text-lg font-semibold">Dettagli Operatore Network</h3>
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
        <Button type="submit" className="w-full">Salva Operatore Network</Button>
      </form>
    </Form>
  );
}