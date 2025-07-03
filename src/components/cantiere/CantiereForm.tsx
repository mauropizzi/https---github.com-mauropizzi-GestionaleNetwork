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
import { servizioOptions, esitoServizioOptions } from "@/lib/cantiere-data"; // Import esitoServizioOptions
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
  // New fields for Riconsegna Cantiere
  addettoRiconsegnaSecurityService: z.string().uuid("Seleziona un addetto valido.").optional().or(z.literal("")),
  responsabileCommittenteRiconsegna: z.string().optional(),
  esitoServizio: z.string().optional(),
  consegneServizio: z.string().optional(),
  status: z.enum(["attivo", "terminato"]).default("attivo"), // Added status field
}).refine(data => data.endDateTime >= data.startDateTime, {
  message: "La data/ora di fine non può essere precedente a quella di inizio.",
  path: ["endDateTime"],
});

interface CantiereFormProps {
  reportId?: string; // Optional ID for editing/restoring
  onCancel?: () => void; // Callback for cancel button
}

export function CantiereForm({ reportId, onCancel }: CantiereFormProps) {
  const [puntiServizio, setPuntiServizio] = useState<PuntoServizio[]>([]);
  const [personaleList, setPersonaleList] = useState<Personale[]>([]);
  const [personaleRiconsegnaList, setPersonaleRiconsegnaList] = useState<Personale[]>([]); // New state for reconsegna personnel
  const [isServicePointOpen, setIsServicePointOpen] = useState(false);
  const [isAddettoOpen, setIsAddettoOpen] = useState(false);
  const [isAddettoRiconsegnaOpen, setIsAddettoRiconsegnaOpen] = useState(false); // New state for reconsegna personnel select
  const [loadingInitialData, setLoadingInitialData] = useState(!!reportId); // Track loading for edit mode

  useEffect(() => {
    const loadData = async () => {
      const fetchedPuntiServizio = await fetchPuntiServizio();
      setPuntiServizio(fetchedPuntiServizio);
      const fetchedPersonale = await fetchPersonale();
      setPersonaleList(fetchedPersonale);
      // Fetch personnel for reconsegna (GPG or Pattuglia)
      const fetchedGpg = await fetchPersonale('GPG');
      const fetchedPattuglia = await fetchPersonale('Pattuglia');
      setPersonaleRiconsegnaList([...fetchedGpg, ...fetchedPattuglia]);
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
      addettoRiconsegnaSecurityService: "",
      responsabileCommittenteRiconsegna: "",
      esitoServizio: "",
      consegneServizio: "",
      status: "attivo", // Default status for new reports
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

  // Effect to load existing report data when reportId is provided
  useEffect(() => {
    const loadReportData = async () => {
      if (reportId) {
        setLoadingInitialData(true);
        const { data: report, error: reportError } = await supabase
          .from('registri_cantiere')
          .select('*, automezzi_utilizzati(*), attrezzi_utilizzati(*)') // Fetch related data
          .eq('id', reportId)
          .single();

        if (reportError) {
          showError(`Errore nel recupero del rapporto di cantiere: ${reportError.message}`);
          console.error("Error fetching cantiere report for edit:", reportError);
          setLoadingInitialData(false);
          return;
        }

        if (report) {
          form.reset({
            reportDate: (report.report_date && typeof report.report_date === 'string') ? parseISO(report.report_date) : new Date(),
            reportTime: report.report_time || format(new Date(), "HH:mm"),
            servicePointId: report.service_point_id || "",
            addetto: report.employee_id || "",
            servizio: report.service_provided || "",
            startDateTime: (report.start_datetime && typeof report.start_datetime === 'string') ? parseISO(report.start_datetime) : undefined,
            endDateTime: (report.end_datetime && typeof report.end_datetime === 'string') ? parseISO(report.end_datetime) : undefined,
            noteVarie: report.notes || "",
            automezzi: report.automezzi_utilizzati || [],
            attrezzi: report.attrezzi_utilizzati || [],
            latitude: report.latitude || undefined,
            longitude: report.longitude || undefined,
            addettoRiconsegnaSecurityService: report.addetto_riconsegna_security_service || "",
            responsabileCommittenteRiconsegna: report.responsabile_committente_riconsegna || "",
            esitoServizio: report.esito_servizio || "",
            consegneServizio: report.consegne_servizio || "",
            status: report.status || "attivo",
          });
        }
        setLoadingInitialData(false);
      }
    };

    loadReportData();
  }, [reportId, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const selectedServicePoint = puntiServizio.find(p => p.id === values.servicePointId);
    if (!selectedServicePoint || !selectedServicePoint.id_cliente) {
      showError("Punto servizio selezionato non valido o senza cliente associato.");
      return;
    }
    const clientId = selectedServicePoint.id_cliente;
    const siteName = selectedServicePoint.nome_punto_servizio;

    const basePayload = {
      report_date: format(values.reportDate, 'yyyy-MM-dd'),
      report_time: values.reportTime,
      client_id: clientId,
      site_name: siteName,
      employee_id: values.addetto,
      service_provided: values.servizio,
      start_datetime: values.startDateTime.toISOString(),
      end_datetime: values.endDateTime.toISOString(),
      notes: values.noteVarie || null,
      addetto_riconsegna_security_service: values.addettoRiconsegnaSecurityService || null,
      responsabile_committente_riconsegna: values.responsabileCommittenteRiconsegna || null,
      esito_servizio: values.esitoServizio || null,
      consegne_servizio: values.consegneServizio || null,
      status: "terminato", // Set status to 'terminato' on successful submission
    };

    let registroId: string | null = null;
    let registroError: any = null;

    if (reportId) {
      // Update existing record
      const { data, error } = await supabase
        .from('registri_cantiere')
        .update(basePayload)
        .eq('id', reportId)
        .select('id')
        .single();
      registroId = data?.id || null;
      registroError = error;
    } else {
      // Insert new record
      const { data, error } = await supabase
        .from('registri_cantiere')
        .insert([basePayload])
        .select('id')
        .single();
      registroId = data?.id || null;
      registroError = error;
    }

    if (registroError || !registroId) {
      showError(`Errore durante la registrazione del rapporto: ${registroError?.message}`);
      console.error("Error upserting registro_cantiere:", registroError);
      return;
    }

    // Handle automezzi and attrezzi: delete existing and insert new ones
    await supabase.from('automezzi_utilizzati').delete().eq('registro_cantiere_id', registroId);
    if (values.automezzi && values.automezzi.length > 0) {
      const automezziPayload = values.automezzi.map(auto => ({ ...auto, registro_cantiere_id: registroId }));
      const { error: automezziInsertError } = await supabase.from('automezzi_utilizzati').insert(automezziPayload);
      if (automezziInsertError) {
        showError(`Errore durante la registrazione degli automezzi: ${automezziInsertError.message}`);
        return;
      }
    }

    await supabase.from('attrezzi_utilizzati').delete().eq('registro_cantiere_id', registroId);
    if (values.attrezzi && values.attrezzi.length > 0) {
      const attrezziPayload = values.attrezzi.map(attrezzo => ({ ...attrezzo, registro_cantiere_id: registroId }));
      const { error: attrezziInsertError } = await supabase.from('attrezzi_utilizzati').insert(attrezziPayload);
      if (attrezziInsertError) {
        showError(`Errore durante la registrazione degli attrezzi: ${attrezziInsertError.message}`);
        return;
      }
    }

    showSuccess(`Rapporto di cantiere ${reportId ? 'modificato' : 'registrato'} con successo!`);
    form.reset();
    if (onCancel) { // Use onCancel to navigate back to history or clear params
      onCancel();
    }
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
    const selectedAddettoRiconsegna = personaleRiconsegnaList.find(p => p.id === values.addettoRiconsegnaSecurityService);
    const addettoRiconsegnaName = selectedAddettoRiconsegna ? `${selectedAddettoRiconsegna.nome} ${selectedAddettoRiconsegna.cognome}` : "N/A";


    const subject = `Rapporto di Cantiere - ${clientName} - ${servicePointName} - ${format(values.reportDate, 'dd/MM/yyyy')}`;
    
    let body = `Dettagli Rapporto di Cantiere:\n\n`;
    body += `Data Rapporto: ${format(values.reportDate, 'dd/MM/yyyy')}\n`;
    body += `Ora Rapporto: ${values.reportTime}\n`;
    if (values.latitude !== undefined && values.longitude !== undefined) {
      body += `Posizione GPS: Lat ${values.latitude.toFixed(6)}, Lon ${values.longitude.toFixed(6)}\n`;
    }
    body += `Cliente: ${clientName}\n`;
    body += `Punto Servizio / Cantiere: ${servicePointName}\n`;
    body += `Addetto Security Service: ${addettoName}\n`;
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
      body += `\n--- Attrezzi Presenti ---\n`;
      values.attrezzi.forEach((attrezzo, index) => {
        body += `Attrezzo ${index + 1}: Tipologia: ${attrezzo.tipologia}, Marca: ${attrezzo.marca}, Quantità: ${attrezzo.quantita}\n`;
      });
    }

    if (values.noteVarie) {
      body += `\n--- Note Varie ---\n${values.noteVarie}\n`;
    }

    // Add new Riconsegna Cantiere fields to body
    body += `\n--- Riconsegna Cantiere ---\n`;
    body += `Addetto Security Service Riconsegna: ${addettoRiconsegnaName}\n`;
    body += `Responsabile Committente Riconsegna: ${values.responsabileCommittenteRiconsegna || 'N/A'}\n`;
    body += `ESITO SERVIZIO: ${values.esitoServizio || 'N/A'}\n`;
    body += `CONSEGNE di Servizio: ${values.consegneServizio || 'N/A'}\n`;


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

  if (loadingInitialData) {
    return <div className="text-center py-8">Caricamento rapporto...</div>;
  }

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
                <FormLabel>Addetto Security Service</FormLabel>
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
          <h2 className="text-xl font-semibold mb-4">Attrezzi Presenti</h2>
          <div className="space-y-4">
            {attrezziFields.map((item, index) => (
              <AttrezzoItem key={item.id} index={index} onRemove={removeAttrezzo} />
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => appendAttrezzo({ tipologia: "", marca: "", quantita: 1 })}
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

        {/* New section: Riconsegna Cantiere */}
        <section className="p-4 border rounded-lg shadow-sm bg-card">
          <h2 className="text-xl font-semibold mb-4">Riconsegna Cantiere</h2>
          <FormField
            control={form.control}
            name="addettoRiconsegnaSecurityService"
            render={({ field }) => (
              <FormItem className="mb-4">
                <FormLabel>Addetto Security Service Riconsegna</FormLabel>
                <Popover open={isAddettoRiconsegnaOpen} onOpenChange={setIsAddettoRiconsegnaOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button variant="outline" role="combobox" className={cn("w-full justify-between", !field.value && "text-muted-foreground")}>
                        {field.value
                          ? personaleRiconsegnaList.find((p) => p.id === field.value)?.nome + ' ' + personaleRiconsegnaList.find((p) => p.id === field.value)?.cognome
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
                        {personaleRiconsegnaList.map((personale) => (
                          <CommandItem
                            value={`${personale.nome} ${personale.cognome}`}
                            key={personale.id}
                            onSelect={() => {
                              form.setValue("addettoRiconsegnaSecurityService", personale.id);
                              setIsAddettoRiconsegnaOpen(false);
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
            name="responsabileCommittenteRiconsegna"
            render={({ field }) => (
              <FormItem className="mb-4">
                <FormLabel>Responsabile Committente Riconsegna</FormLabel>
                <FormControl>
                  <Input placeholder="Nome Responsabile" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="esitoServizio"
            render={({ field }) => (
              <FormItem className="mb-4">
                <FormLabel>ESITO SERVIZIO</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona esito" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {esitoServizioOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
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
            name="consegneServizio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CONSEGNE di Servizio</FormLabel>
                <FormControl>
                  <Textarea placeholder="Dettagli sulle consegne di servizio..." rows={3} {...field} />
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
          {reportId ? (
            <>
              <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700">
                SALVA MODIFICHE
              </Button>
              {onCancel && (
                <Button type="button" variant="outline" className="w-full" onClick={onCancel}>
                  ANNULLA
                </Button>
              )}
            </>
          ) : (
            <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700">
              REGISTRA RAPPORTO
            </Button>
          )}
        </div>
      </form>
    </FormProvider>
  );
}