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
  nomeOperatore: z.string().min(2, "Il nome dell'operatore è richiesto."),
  referente: z.string().optional(),
  telefono: z.string().optional(),
  email: z.string().email("Formato email non valido.").optional().or(z.literal("")),
  tipoServizio: z.string().optional(),
});

export function OperatoriNetworkForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nomeOperatore: "",
      referente: "",
      telefono: "",
      email: "",
      tipoServizio: "",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    console.log("Dati Operatore Network:", values);
    // Qui potresti inviare i dati a un backend o gestirli in altro modo
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <h3 className="text-lg font-semibold">Dettagli Operatore Network</h3>
        <FormField
          control={form.control}
          name="nomeOperatore"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome Operatore/Azienda</FormLabel>
              <FormControl>
                <Input placeholder="Nome Operatore/Azienda" {...field} />
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
          name="tipoServizio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo di Servizio Fornito</FormLabel>
              <FormControl>
                <Input placeholder="Es: Trasporto valori, Vigilanza armata" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">Salva Operatore Network</Button>
      </form>
    </Form>
  );
}