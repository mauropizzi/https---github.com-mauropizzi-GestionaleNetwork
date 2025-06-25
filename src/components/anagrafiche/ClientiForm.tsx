import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

const formSchema = z.object({
  ragione_sociale: z.string().min(2, "La ragione sociale è richiesta."),
  partita_iva: z.string().optional(),
  codice_fiscale: z.string().optional(),
  indirizzo: z.string().optional(),
  cap: z.string().optional(),
  citta: z.string().optional(),
  provincia: z.string().optional(),
  telefono: z.string().optional(),
  email: z.string().email("Formato email non valido.").optional().or(z.literal("")),
  pec: z.string().email("Formato PEC non valido.").optional().or(z.literal("")),
  sdi: z.string().optional(),
  attivo: z.boolean().default(true).optional(),
  note: z.string().optional(),
});

export function ClientiForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ragione_sociale: "",
      codice_fiscale: "",
      partita_iva: "",
      indirizzo: "",
      citta: "",
      cap: "",
      provincia: "",
      telefono: "",
      email: "",
      pec: "",
      sdi: "",
      attivo: true,
      note: "",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    console.log("Dati Cliente:", values);
    // Qui potresti inviare i dati a un backend o gestirli in altro modo
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <h3 className="text-lg font-semibold">Dettagli Cliente</h3>
        <FormField
          control={form.control}
          name="ragione_sociale"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ragione Sociale</FormLabel>
              <FormControl>
                <Input placeholder="Ragione Sociale del Cliente" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="codice_fiscale"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Codice Fiscale</FormLabel>
                <FormControl>
                  <Input placeholder="Codice Fiscale" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="partita_iva"
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
        </div>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="pec"
            render={({ field }) => (
              <FormItem>
                <FormLabel>PEC</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="pec@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="sdi"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Codice SDI</FormLabel>
                <FormControl>
                  <Input placeholder="Codice SDI" {...field} />
                </FormControl>
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
                  Cliente Attivo
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
                <Textarea placeholder="Note sul cliente..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">Salva Cliente</Button>
      </form>
    </Form>
  );
}