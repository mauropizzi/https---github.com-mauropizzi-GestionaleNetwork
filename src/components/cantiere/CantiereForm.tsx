import React, { useState, useEffect } from "react";
import { useForm, useFieldArray, FormProvider } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Separator } from "@/components/ui/separator";
import { PlusCircle } from "lucide-react";
import { showSuccess, showError, showInfo } from "@/utils/toast";
import { AutomezzoItem } from "./AutomezzoItem";
import { AttrezzoItem } from "./AttrezzoItem";
import { addettiList, servizioOptions, tipologiaAutomezzoOptions, marcaAutomezzoOptions, tipologiaAttrezzoOptions, marcaAttrezzoOptions } from "@/lib/cantiere-data";
import { RECIPIENT_EMAIL } from "@/lib/config";
import { clienteOptions } from "@/lib/anagrafiche-data"; // Import corretto

const automezzoSchema = z.object({
  tipologia: z.string().min(1, "Tipologia richiesta."),
  marca: z.string().min(1, "Marca richiesta."),
  targa: z.string().min(1, "Targa richiesta."),
  oreLavoro: z.coerce.number().min(0, "Ore di lavoro non valide."),
});

const attrezzoSchema = z.object({
  tipologia: z.string().min(1, "Tipologia richiesta."),
  marca: z.string().min(1, "Marca richiesta."),
  quantita: z.coerce.number().min(1, "Quantità non valida."),
  oreUtilizzo: z.coerce.number().min(0, "Ore di utilizzo non valide."),
});

const formSchema = z.object({
  reportDate: z.string().min(1, "La data del rapporto è richiesta."),
  reportTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato ora non valido (HH:MM)."),
  cliente: z.string().min(1, "Il cliente è richiesto."), // Now stores client ID
  cantiere: z.string().min(1, "Il cantiere è richiesto."),
  addetto: z.string().min(1, "L'addetto è richiesto."),
  servizio: z.string().min(1, "Il servizio è richiesto."),
  oreServizio: z.coerce.number().min(0.5, "Le ore di servizio devono essere almeno 0.5."),
  descrizioneLavori: z.string().min(10, "La descrizione dei lavori è troppo breve.").max(500, "La descrizione dei lavori è troppo lunga."),
  noteVarie: z.string().optional(),
  automezzi: z.array(automezzoSchema).optional(),
  attrezzi: z.array(attrezzoSchema).optional(),
});

export function CantiereForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reportDate: format(new Date(), "yyyy-MM-dd"),
      reportTime: format(new Date(), "HH:mm"),
      cliente: "",
      cantiere: "",
      addetto: "",
      servizio: "",
      oreServizio: 0,
      descrizioneLavori: "",
      noteVarie: "",
      automezzi: [],
      attrezzi: [],
    },
  });

  const { fields: automezziFields, append: appendAutomezzo, remove: removeAutomezzo } = useFieldArray({
    control: form.control,
    name: "automezzi",
  });

  const { fields: attrezziFields, append: appendAttrezzo, remove: removeAttrezzo } = useFieldArray({
    control: form.control,
    name: "attrezzi",
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    console.log("Registro di Cantiere Data:", values);
    showSuccess("Rapporto di cantiere registrato con successo!");
    // Qui si potrebbe inviare i dati a un backend
    form.reset(); // Reset form after submission
  };

  const handleSetCurrentDate = () => {
    form.setValue("reportDate", format(new Date(), "yyyy-MM-dd"));
  };

  const handleSetCurrentTime = () => {
    form.setValue("reportTime", format(new Date(), "HH:mm"));
  };

  const handleGpsTracking = () => {
    showInfo("Acquisizione posizione GPS (funzionalità da implementare).");
    // In un'applicazione reale, qui si integrerebbe con un servizio GPS
  };

  const handleEmail = () => {
    showInfo(`Invio email a ${RECIPIENT_EMAIL} (funzionalità da implementare).`);
    // Logica per inviare email
  };

  const handlePrintPdf = () => {
    showInfo("Generazione PDF (funzionalità da implementare).");
    // Logica per generare PDF
  };

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-4">
        {/* Dati Generali */}
        <section className="p-4 border rounded-lg shadow-sm bg-card">
          <h2 className="text-xl font-semibold mb-4">Dati Generali</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <FormField
              control={form.control}
              name="reportDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data Rapporto</FormLabel>
                  <div className="flex items-center space-x-2">
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <Button type="button" variant="outline" onClick={handleSetCurrentDate}>
                      Data Attuale
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="reportTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ora Rapporto</FormLabel>
                  <div className="flex items-center space-x-2">
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <Button type="button" variant="outline" onClick={handleSetCurrentTime}>
                      Ora Attuale
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <Button type="button" className="w-full bg-blue-600 hover:bg-blue-700 mb-4" onClick={handleGpsTracking}>
            ACQUISIZIONE POSIZIONE GPS
          </Button>
          <FormField
            control={form.control}
            name="cliente"
            render={({ field }) => (
              <FormItem className="mb-4">
                <FormLabel>Cliente</FormLabel>
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
            name="cantiere"
            render={({ field }) => (
              <FormItem className="mb-4">
                <FormLabel>Cantiere</FormLabel>
                <FormControl>
                  <Input placeholder="Nome o indirizzo del cantiere" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="addetto"
            render={({ field }) => (
              <FormItem className="mb-4">
                <FormLabel>Addetto</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona un addetto" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {addettiList.map((addetto) => (
                      <SelectItem key={addetto} value={addetto}>
                        {addetto}
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
            name="servizio"
            render={({ field }) => (
              <FormItem className="mb-4">
                <FormLabel>Servizio</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona il servizio" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {servizioOptions.map((servizio) => (
                      <SelectItem key={servizio} value={servizio}>
                        {servizio}
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
            name="oreServizio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ore di Servizio</FormLabel>
                <FormControl>
                  <Input type="number" step="0.5" placeholder="8" {...field} onChange={e => field.onChange(e.target.valueAsNumber)} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </section>

        {/* Descrizione Lavori */}
        <section className="p-4 border rounded-lg shadow-sm bg-card">
          <h2 className="text-xl font-semibold mb-4">Descrizione Lavori</h2>
          <FormField
            control={form.control}
            name="descrizioneLavori"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dettagli Lavori Svolti</FormLabel>
                <FormControl>
                  <Textarea placeholder="Descrivi dettagliatamente i lavori svolti..." rows={5} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </section>

        {/* Automezzi Utilizzati */}
        <section className="p-4 border rounded-lg shadow-sm bg-card">
          <h2 className="text-xl font-semibold mb-4">Automezzi Utilizzati</h2>
          <div className="space-y-4">
            {automezziFields.map((item, index) => (
              <AutomezzoItem key={item.id} index={index} onRemove={removeAutomezzo} />
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => appendAutomezzo({ tipologia: "", marca: "", targa: "", oreLavoro: 0 })}
            className="mt-4 w-full"
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Aggiungi Automezzo
          </Button>
        </section>

        {/* Attrezzi Utilizzati */}
        <section className="p-4 border rounded-lg shadow-sm bg-card">
          <h2 className="text-xl font-semibold mb-4">Attrezzi Utilizzati</h2>
          <div className="space-y-4">
            {attrezziFields.map((item, index) => (
              <AttrezzoItem key={item.id} index={index} onRemove={removeAttrezzo} />
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => appendAttrezzo({ tipologia: "", marca: "", quantita: 1, oreUtilizzo: 0 })}
            className="mt-4 w-full"
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Aggiungi Attrezzo
          </Button>
        </section>

        {/* Note Varie */}
        <section className="p-4 border rounded-lg shadow-sm bg-card">
          <h2 className="text-xl font-semibold mb-4">Note Varie</h2>
          <FormField
            control={form.control}
            name="noteVarie"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Eventuali Note Aggiuntive</FormLabel>
                <FormControl>
                  <Textarea placeholder="Inserisci qui eventuali note..." rows={3} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </section>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <Button type="button" className="w-full bg-blue-600 hover:bg-blue-700" onClick={handleEmail}>
            INVIA EMAIL
          </Button>
          <Button type="button" className="w-full bg-green-600 hover:bg-green-700" onClick={handlePrintPdf}>
            STAMPA PDF
          </Button>
          <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700">
            REGISTRA RAPPORTO
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}