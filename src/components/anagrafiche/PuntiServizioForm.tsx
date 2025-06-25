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
import { clienteOptions } from "@/lib/anagrafiche-data"; // Import from new central file

const formSchema = z.object({
  nomePuntoServizio: z.string().min(2, "Il nome del punto servizio è richiesto."),
  idCliente: z.string().min(1, "Seleziona un cliente."),
  indirizzo: z.string().optional(),
  citta: z.string().optional(),
  cap: z.string().optional(),
  provincia: z.string().optional(),
  referente: z.string().optional(),
  telefonoReferente: z.string().optional(),
});

export function PuntiServizioForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nomePuntoServizio: "",
      idCliente: "",
      indirizzo: "",
      citta: "",
      cap: "",
      provincia: "",
      referente: "",
      telefonoReferente: "",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    console.log("Dati Punto Servizio:", values);
    // Qui potresti inviare i dati a un backend o gestirli in altro modo
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <h3 className="text-lg font-semibold">Dettagli Punto Servizio</h3>
        <FormField
          control={form.control}
          name="nomePuntoServizio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome Punto Servizio</FormLabel>
              <FormControl>
                <Input placeholder="Nome Punto Servizio" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="idCliente"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cliente Associato</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona un cliente" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {clienteOptions.map((cliente) => (
                    <SelectItem key={cliente.id} value={cliente.id}>
                      {cliente.nome}
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
          name="indirizzo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Indirizzo</FormLabel>
              <FormControl>
                <Input placeholder="Via, numero civico" {...field} />
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
                  <Input placeholder="Città" {...field} />
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
                  <Input placeholder="CAP" {...field} />
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
                  <Input placeholder="Provincia" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="referente"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Referente in loco</FormLabel>
                <FormControl>
                  <Input placeholder="Nome Referente" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="telefonoReferente"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefono Referente</FormLabel>
                <FormControl>
                  <Input placeholder="Telefono Referente" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button type="submit" className="w-full">Salva Punto Servizio</Button>
      </form>
    </Form>
  );
}