import React, { useState, useEffect } from "react";
import { useForm, useFieldArray, FormProvider } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, parseISO, isValid } from "date-fns"; // Import parseISO and isValid
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
import { Cliente } from "@/lib/anagrafiche-data";
import { fetchClienti } from "@/lib/data-fetching";
import { sendEmail } from "@/utils/email";
import jsPDF from 'jspdf';
import 'jspdf-autotable';

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
  reportDate: z.date({ // Changed to z.date()
    required_error: "La data del rapporto è richiesta.",
  }),
  reportTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato ora non valido (HH:MM)."),
  cliente: z.string().min(1, "Il cliente è richiesto."),
  cantiere: z.string().min(1, "Il cantiere è richiesto."),
  addetto: z.string().min(1, "L'addetto è richiesto."),
  servizio: z.string().min(1, "Il servizio è richiesto."),
  oreServizio: z.coerce.number().min(0.5, "Le ore di servizio devono essere almeno 0.5."),
  descrizioneLavori: z.string().min(10, "La descrizione dei lavori è troppo breve.").max(500, "La descrizione dei lavori è troppo lunga."),
  noteVarie: z.string().optional(),
  automezzi: z.array(automezzoSchema).optional(),
  attrezzi: z.array(attrezzoSchema).optional(),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
});

export function CantiereForm() {
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
      reportDate: new Date(), // Default to Date object
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

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    console.log("Registro di Cantiere Data:", values);
    showSuccess("Rapporto di cantiere registrato con successo!");
    form.reset();
  };

  const handleSetCurrentDate = () => {
    form.setValue("reportDate", new Date()); // Set to Date object
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

  const handleEmail = () => {
    const values = form.getValues();
    const selectedClient = clienti.find(c => c.id === values.cliente);
    const clientName = selectedClient ? selectedClient.nome_cliente : "N/A";

    const subject = `Rapporto di Cantiere - ${clientName} - ${values.cantiere} - ${format(values.reportDate, 'dd/MM/yyyy')}`; // Use values.reportDate directly
    
    let body = `Dettagli Rapporto di Cantiere:\n\n`;
    body += `Data Rapporto: ${format(values.reportDate, 'dd/MM/yyyy')}\n`; // Use values.reportDate directly
    body += `Ora Rapporto: ${values.reportTime}\n`;
    if (values.latitude !== undefined && values.longitude !== undefined) {
      body += `Posizione GPS: Lat ${values.latitude.toFixed(6)}, Lon ${values.longitude.toFixed(6)}\n`;
    }
    body += `Cliente: ${clientName}\n`;
    body += `Cantiere: ${values.cantiere}\n`;
    body += `Addetto: ${values.addetto}\n`;
    body += `Servizio: ${values.servizio}\n`;
    body += `Ore di Servizio: ${values.oreServizio}\n`;
    body += `\nDescrizione Lavori Svolti:\n${values.descrizioneLavori}\n`;

    if (values.automezzi && values.automezzi.length > 0) {
      body += `\n--- Automezzi Utilizzati ---\n`;
      values.automezzi.forEach((auto, index) => {
        body += `Automezzo ${index + 1}:\n`;
        body += `  Tipologia: ${auto.tipologia}\n`;
        body += `  Marca: ${auto.marca}\n`;
        body += `  Targa: ${auto.targa}\n`;
        body += `  Ore di Lavoro: ${auto.oreLavoro}\n`;
      });
    }

    if (values.attrezzi && values.attrezzi.length > 0) {
      body += `\n--- Attrezzi Utilizzati ---\n`;
      values.attrezzi.forEach((attrezzo, index) => {
        body += `Attrezzo ${index + 1}:\n`;
        body += `  Tipologia: ${attrezzo.tipologia}\n`;
        body += `  Marca: ${attrezzo.marca}\n`;
        body += `  Quantità: ${attrezzo.quantita}\n`;
        body += `  Ore di Utilizzo: ${attrezzo.oreUtilizzo}\n`;
      });
    }

    if (values.noteVarie) {
      body += `\n--- Note Varie ---\n${values.noteVarie}\n`;
    }

    sendEmail(subject, body);
  };

  const handlePrintPdf = () => {
    showInfo("Generazione PDF per il rapporto di cantiere...");
    const values = form.getValues();
    const selectedClient = clienti.find(c => c.id === values.cliente);
    const clientName = selectedClient ? selectedClient.nome_cliente : "N/A";

    const doc = new jsPDF();
    let y = 20;

    doc.setFontSize(18);
    doc.text("Rapporto di Cantiere", 14, y);
    y += 10;

    doc.setFontSize(10);
    doc.text(`Data Rapporto: ${format(values.reportDate, 'dd/MM/yyyy')}`, 14, y); // Use values.reportDate directly
    y += 7;
    doc.text(`Ora Rapporto: ${values.reportTime}`, 14, y);
    y += 7;
    if (values.latitude !== undefined && values.longitude !== undefined) {
      doc.text(`Posizione GPS: Lat ${values.latitude.toFixed(6)}, Lon ${values.longitude.toFixed(6)}`, 14, y);
      y += 7;
    }
    doc.text(`Cliente: ${clientName}`, 14, y);
    y += 7;
    doc.text(`Cantiere: ${values.cantiere}`, 14, y);
    y += 7;
    doc.text(`Addetto: ${values.addetto}`, 14, y);
    y += 7;
    doc.text(`Servizio: ${values.servizio}`, 14, y);
    y += 7;
    doc.text(`Ore di Servizio: ${values.oreServizio}`, 14, y);
    y += 10;

    doc.setFontSize(12);
    doc.text("Descrizione Lavori Svolti:", 14, y);
    y += 5;
    doc.setFontSize(10);
    const splitDescription = doc.splitTextToSize(values.descrizioneLavori, 180);
    doc.text(splitDescription, 14, y);
    y += (splitDescription.length * 5) + 10;

    if (values.automezzi && values.automezzi.length > 0) {
      doc.setFontSize(12);
      doc.text("Automezzi Utilizzati:", 14, y);
      y += 5;
      (doc as any).autoTable({
        startY: y,
        head: [['Tipologia', 'Marca', 'Targa', 'Ore di Lavoro']],
        body: values.automezzi.map(auto => [auto.tipologia, auto.marca, auto.targa, auto.oreLavoro]),
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [230, 230, 230], textColor: [0, 0, 0], fontStyle: 'bold' },
        margin: { left: 14, right: 14 },
        didDrawPage: (data: any) => { y = data.cursor.y; }
      });
      y += 10;
    }

    if (values.attrezzi && values.attrezzi.length > 0) {
      doc.setFontSize(12);
      doc.text("Attrezzi Utilizzati:", 14, y);
      y += 5;
      (doc as any).autoTable({
        startY: y,
        head: [['Tipologia', 'Marca', 'Quantità', 'Ore di Utilizzo']],
        body: values.attrezzi.map(attrezzo => [attrezzo.tipologia, attrezzo.marca, attrezzo.quantita, attrezzo.oreUtilizzo]),
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [230, 230, 230], textColor: [0, 0, 0], fontStyle: 'bold' },
        margin: { left: 14, right: 14 },
        didDrawPage: (data: any) => { y = data.cursor.y; }
      });
      y += 10;
    }

    if (values.noteVarie) {
      doc.setFontSize(12);
      doc.text("Note Varie:", 14, y);
      y += 5;
      doc.setFontSize(10);
      const splitNotes = doc.splitTextToSize(values.noteVarie, 180);
      doc.text(splitNotes, 14, y);
      y += (splitNotes.length * 5);
    }

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