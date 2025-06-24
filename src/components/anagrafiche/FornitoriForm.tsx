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

const formSchema = z.object({
  nomeFornitore: z.string().min(2, "Il nome del fornitore è richiesto."),
  partitaIva: z.string().optional(),
  referente: z.string().optional(),
  telefono: z.string().optional(),
  email: z.string().email("Formato email non valido.").optional().or(z.literal("")),
  tipoFornitura: z.string().optional(),
});

export function FornitoriForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nomeFornitore: "",
      partitaIva: "",
      referente: "",
      telefono: "",
      email: "",
      tipoFornitura: "",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    console.log("Dati Fornitore:", values);
    // Qui potresti inviare i dati a un backend o gestirli in altro modo
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <h3 className="text-lg font-semibold">Dettagli Fornitore</h3>
        <FormField
          control={form.control}
          name="nomeFornitore"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome Fornitore/Azienda</FormLabel>
              <FormControl>
                <Input placeholder="Nome Fornitore/Azienda" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="partitaIva"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Partita IVA</FormLabel>
              <FormControl>
                <Input placeholder="Partita IVA" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="referente"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Referente</FormLabel>
              <FormControl>
                <Input placeholder="Nome Referente" {...field} />
              </FormControl>
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
        <FormField
          control={form.control}
          name="tipoFornitura"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo di Fornitura</FormLabel>
              <FormControl>
                <Input placeholder="Es: Uniformi, Attrezzature" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">Salva Fornitore</Button>
      </form>
    </Form>
  );
}