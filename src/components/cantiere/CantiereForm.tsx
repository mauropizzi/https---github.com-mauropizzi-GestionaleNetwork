import React, { useState, useEffect } from "react";
import { useForm, useFieldArray, FormProvider } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, parseISO, isValid } from "date-fns";
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
import { PlusCircle, Check, ChevronsUpDown } from "lucide-react";
import { showSuccess, showError, showInfo } from "@/utils/toast";
import { AutomezzoItem } from "./AutomezzoItem";
import { AttrezzoItem } from "./AttrezzoItem";
import { servizioOptions } from "@/lib/cantiere-data";
import { Personale, PuntoServizio } from "@/lib/anagrafiche-data";
import { fetchPuntiServizio, fetchPersonale } from "@/lib/data-fetching";
import { sendEmail } from "@/utils/email";
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { supabase } from "@/integrations/supabase/client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { cn } from "@/lib/utils";

const automezzoSchema = z.object({
  tipologia: z.string().min(1, "Tipologia richiesta."),
  marca: z.string().min(1, "Marca richiesta."),
  targa: z.string().min(1, "Targa richiesta."),
});

const attrezzoSchema = z.object({
  tipologia: z.string().min(1, "Tipologia richiesta."),
  marca: z.string().min(1, "Marca richiesta."),
  quantita: z.coerce.number().min(1, "Quantità non valida."),
  oreUtilizzo: z.coerce.number().min(0, "Ore di utilizzo non valide."),
});

const formSchema = z.object({
  reportDate: z.date({
    required_error: "La data del rapporto è richiesta.",
  }),
  reportTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato ora non valido (HH:MM)."),
  servicePointId: z.string().uuid("Seleziona un punto servizio valido.").nonempty("Il punto servizio è richiesto."),
  addetto: z.string().uuid("Seleziona un addetto valido.").nonempty("L'addetto è richiesto."),
  servizio: z.string().min(1, "Il servizio è richiesto."),
  startDateTime: z.date({ required_error: "La data e ora di inizio sono richieste." }),
  endDateTime: z.date({ required_error: "La data e ora di fine sono richieste." }),
  noteVarie: z.string().optional(),
  automezzi: z.array(automezzoSchema).optional(),
  attrezzi: z.array(attrezzoSchema).optional(),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
}).refine(data => data.endDateTime >= data.startDateTime, {
  message: "La data/ora di fine non può essere precedente a quella di inizio.",
  path: ["endDateTime"],
});

export function CantiereForm() {
  const [puntiServizio, setPuntiServizio] = useState<PuntoServizio[]>([]);
  const [personaleList, setPersonaleList] = useState<Personale[]>([]);
  const [isServicePointOpen, setIsServicePointOpen] = useState(false);
  const [isAddettoOpen, setIsAddettoOpen] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const fetchedPuntiServizio = await fetchPuntiServizio();
      setPuntiServizio(fetchedPuntiServizio);
      const fetchedPersonale = await fetchPersonale();
      setPersonaleList(fetchedPersonale);
    };
    loadData();
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reportDate: new Date(),
      reportTime: format(new Date(), "HH:mm"),
      servicePointId: "",
      addetto: "",
      servizio: "",
      startDateTime: undefined,
      endDateTime: undefined,
      noteVarie: "",
      automezzi: [],
      attrezzi: [],
      latitude: undefined,
      longitude: undefined,
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

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const selectedServicePoint = puntiServizio.find(p => p.id === values.servicePointId);
    if (!selectedServicePoint || !selectedServicePoint.id_cliente) {
      showError("Punto servizio selezionato non valido o senza cliente associato.");
      return;
    }
    const clientId = selectedServicePoint.id_cliente;
    const siteName = selectedServicePoint.nome_punto_servizio;

    const { data: registroData, error: registroError } = await supabase
      .from('registri_cantiere')
      .insert([{
        report_date: format(values.reportDate, 'yyyy-MM-dd'),
        report_time: values.reportTime,
        client_id: clientId,
        site_name: siteName,
        employee_id: values.addetto,
        service_provided: values.servizio,
        start_datetime: values.startDateTime.toISOString(),
        end_datetime: values.endDateTime.toISOString(),
        notes: values.noteVarie || null,
      }])
      .select('id')
      .single();

    if (registroError || !registroData) {
      showError(`Errore durante la registrazione del rapporto: ${registroError?.message}`);
      console.error("Error inserting registro_cantiere:", registroError);
      return;
    }

    const registroId = registroData.id;

    if (values.automezzi && values.automezzi.length > 0) {
      const automezziPayload = values.automezzi.map(auto => ({ ...auto, registro_cantiere_id: registroId }));
      const { error: automezziError } = await supabase.from('automezzi_utilizzati').insert(automezziPayload);
      if (automezziError) {
        showError(`Errore durante la registrazione degli automezzi: ${automezziError.message}`);
        return;
      }
    }

    if (values.attrezzi && values.attrezzi.length > 0) {
      const attrezziPayload = values.attrezzi.map(attrezzo => ({ ...attrezzo, registro_cantiere_id: registroId, ore_utilizzo: attrezzo.oreUtilizzo }));
      const { error: attrezziError } = await supabase.from('attrezzi_utilizzati').insert(attrezziPayload);
      if (attrezziError) {
        showError(`Errore durante la registrazione degli attrezzi: ${attrezziError.message}`);
        return;
      }
    }

    showSuccess("Rapporto di cantiere registrato con successo!");
    form.reset();
  };

  const handleSetCurrentDate = () => {
    form.setValue("reportDate", new Date());
  };

  const handleSetCurrentTime = () => {
    form.setValue("reportTime", format(new Date(), "HH:mm"));
  };

  const handleGpsTracking = () => {
    if (navigator.geolocation) {
      showInfo("Acquisizione posizione GPS del cantiere...");
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          form.setValue("latitude", latitude);
          form.setValue("longitude", longitude);
          showSuccess(`Posizione GPS acquisita: Lat ${latitude.toFixed(6)}, Lon ${longitude.toFixed(6)}`);
        },
        (error) => {
          showError(`Errore acquisizione GPS: ${error.message}`);
          console.error("Error getting GPS position:", error);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      showError("La geolocalizzazione non è supportata dal tuo browser.");
    }
  };

  const generatePdfAndEmail = (action: 'print' | 'email') => {
    const values = form.getValues();
    const selectedServicePoint = puntiServizio.find(p => p.id === values.servicePointId);
    const servicePointName = selectedServicePoint ? selectedServicePoint.nome_punto_servizio : "N/A";
    const clientName = selectedServicePoint?.clienti?.nome_cliente || "N/A";
    const selectedAddetto = personaleList.find(p => p.id === values.addetto);
    const addettoName = selectedAddetto ? `${selectedAddetto.nome} ${selectedAddetto.cognome}` : "N/A";

    const subject = `Rapporto di Cantiere - ${clientName} - ${servicePointName} - ${format(values.reportDate, 'dd/MM/yyyy')}`;
    
    let body = `Dettagli Rapporto di Cantiere:\n\n`;
    body += `Data Rapporto: ${format(values.reportDate, 'dd/MM/yyyy')}\n`;
    body += `Ora Rapporto: ${values.reportTime}\n`;
    if (values.latitude !== undefined && values.longitude !== undefined) {
      body += `Posizione GPS: Lat ${values.latitude.toFixed(6)}, Lon ${values.longitude.toFixed(6)}\n`;
    }
    body += `Cliente: ${clientName}\n`;
    body += `Punto Servizio / Cantiere: ${servicePointName}\n`;
    body += `Addetto: ${addettoName}\n`;
    body += `Servizio: ${values.servizio}\n`;
    body += `Inizio Servizio: ${values.startDateTime ? format(values.startDateTime, 'dd/MM/yyyy HH:mm') : 'N/A'}\n`;
    body += `Fine Servizio: ${values.endDateTime ? format(values.endDateTime, 'dd/MM/yyyy HH:mm') : 'N/A'}\n`;

    if (values.automezzi && values.automezzi.length > 0) {
      body += `\n--- Automezzi Presenti ---\n`;
      values.automezzi.forEach((auto, index) => {
        body += `Automezzo ${index + 1}: Tipologia: ${auto.tipologia}, Marca: ${auto.marca}, Targa: ${auto.targa}\n`;
      });
    }

    if (values.attrezzi && values.attrezzi.length > 0) {
      body += `\n--- Attrezzi Utilizzati ---\n`;
      values.attrezzi.forEach((attrezzo, index) => {
        body += `Attrezzo ${index + 1}: Tipologia: ${attrezzo.tipologia}, Marca: ${attrezzo.marca}, Quantità: ${attrezzo.quantita}, Ore: ${attrezzo.oreUtilizzo}\n`;
      });
    }

    if (values.noteVarie) {
      body += `\n--- Note Varie ---\n${values.noteVarie}\n`;
    }

    if (action === 'email') {
      sendEmail(subject, body);
      return;
    }

    const doc = new jsPDF();
    let y = 20;
    doc.setFontSize(18);
    doc.text("Rapporto di Cantiere", 14, y);
    y += 10;
    doc.setFontSize(10);
    doc.text(body, 14, y);
    doc.output('dataurlnewwindow');
    showSuccess("PDF del rapporto di cantiere generato con successo!");
  };

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-4">
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
                      <Input
                        type="date"
                        value={field.value ? format(field.value, 'yyyy-MM-dd') : ''}
                        onChange={(e) => {
                          const date = parseISO(e.target.value);
                          field.onChange(isValid(date) ? date : undefined);
                        }}
                      />
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
          {form.watch("latitude") !== undefined && form.watch("longitude") !== undefined && (
            <p className="text-sm text-gray-500 mt-1 text-center mb-4">
              Latitudine: {form.watch("latitude")?.toFixed(6)}, Longitudine: {form.watch("longitude")?.toFixed(6)}
            </p>
          )}
          <FormField
            control={form.control}
            name="servicePointId"
            render={({ field }) => (
              <FormItem className="mb-4">
                <FormLabel>Punto Servizio / Cantiere</FormLabel>
                <Popover open={isServicePointOpen} onOpenChange={setIsServicePointOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button variant="outline" role="combobox" className={cn("w-full justify-between", !field.value && "text-muted-foreground")}>
                        {field.value ? puntiServizio.find(p => p.id === field.value)?.nome_punto_servizio : "Seleziona un punto servizio"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                      <CommandInput placeholder="Cerca punto servizio..." />
                      <CommandEmpty>Nessun punto servizio trovato.</CommandEmpty>
                      <CommandGroup>
                        {puntiServizio.map((punto) => (
                          <CommandItem
                            value={punto.nome_punto_servizio}
                            key={punto.id}
                            onSelect={() => {
                              form.setValue("servicePointId", punto.id);
                              setIsServicePointOpen(false);
                            }}
                          >
                            <Check className={cn("mr-2 h-4 w-4", punto.id === field.value ? "opacity-100" : "opacity-0")} />
                            {punto.nome_punto_servizio}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
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
                <Popover open={isAddettoOpen} onOpenChange={setIsAddettoOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button variant="outline" role="combobox" className={cn("w-full justify-between", !field.value && "text-muted-foreground")}>
                        {field.value
                          ? personaleList.find((p) => p.id === field.value)?.nome + ' ' + personaleList.find((p) => p.id === field.value)?.cognome
                          : "Seleziona un addetto"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                      <CommandInput placeholder="Cerca addetto..." />
                      <CommandEmpty>Nessun addetto trovato.</CommandEmpty>
                      <CommandGroup>
                        {personaleList.map((personale) => (
                          <CommandItem
                            value={`${personale.nome} ${personale.cognome}`}
                            key={personale.id}
                            onSelect={() => {
                              form.setValue("addetto", personale.id);
                              setIsAddettoOpen(false);
                            }}
                          >
                            <Check className={cn("mr-2 h-4 w-4", personale.id === field.value ? "opacity-100" : "opacity-0")} />
                            {personale.nome} {personale.cognome}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="startDateTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data e Ora Inizio Servizio</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      value={field.value ? format(field.value, "yyyy-MM-dd'T'HH:mm") : ''}
                      onChange={(e) => {
                        const date = parseISO(e.target.value);
                        field.onChange(isValid(date) ? date : undefined);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="endDateTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data e Ora Fine Servizio</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      value={field.value ? format(field.value, "yyyy-MM-dd'T'HH:mm") : ''}
                      onChange={(e) => {
                        const date = parseISO(e.target.value);
                        field.onChange(isValid(date) ? date : undefined);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </section>

        <section className="p-4 border rounded-lg shadow-sm bg-card">
          <h2 className="text-xl font-semibold mb-4">Automezzi Presenti</h2>
          <div className="space-y-4">
            {automezziFields.map((item, index) => (
              <AutomezzoItem key={item.id} index={index} onRemove={removeAutomezzo} />
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => appendAutomezzo({ tipologia: "", marca: "", targa: "" })}
            className="mt-4 w-full"
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Aggiungi Automezzo
          </Button>
        </section>

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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <Button type="button" className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => generatePdfAndEmail('email')}>
            INVIA EMAIL
          </Button>
          <Button type="button" className="w-full bg-green-600 hover:bg-green-700" onClick={() => generatePdfAndEmail('print')}>
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