import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { it } from 'date-fns/locale';
import { CalendarIcon, Mail, Printer, Save } from "lucide-react"; // Assicurati che queste icone siano importate
import jsPDF from 'jspdf';
import 'jspdf-autotable';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { showSuccess, showError, showInfo } from "@/utils/toast";
import {
  serviceLocationOptions,
  serviceTypeOptions,
  vehicleMakeModelOptions,
  vehiclePlateOptions,
  vehicleInitialStateOptions,
  bodyworkDamageOptions,
  employeeNameOptions,
} from "@/lib/dotazioni-data";
import { RECIPIENT_EMAIL } from "@/lib/config";
import { sendEmail } from "@/utils/email";

const formSchema = z.object({
  serviceDate: z.date({
    required_error: "La data del servizio è richiesta.",
  }),
  employeeId: z.string().min(1, "L'addetto è richiesto."),
  serviceLocation: z.string().min(1, "La località è richiesta."),
  serviceType: z.string().min(1, "Il tipo di servizio è richiesto."),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato ora inizio non valido (HH:MM)."),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato ora fine non valido (HH:MM)."),
  vehicleMakeModel: z.string().min(1, "Il modello del veicolo è richiesto."),
  vehiclePlate: z.string().min(1, "La targa del veicolo è richiesta."),
  startKm: z.coerce.number().min(0, "I KM iniziali sono richiesti."),
  endKm: z.coerce.number().min(0, "I KM finali sono richiesti."),
  vehicleInitialState: z.string().min(1, "Lo stato iniziale del veicolo è richiesto."),
  bodyworkDamage: z.string().optional(),
  vehicleAnomalies: z.string().optional(),
  gps: z.boolean().default(false),
  radioVehicle: z.boolean().default(false),
  swivelingLamp: z.boolean().default(false),
  radioPortable: z.boolean().default(false),
  flashlight: z.boolean().default(false),
  extinguisher: z.boolean().default(false),
  spareTire: z.boolean().default(false),
  highVisibilityVest: z.boolean().default(false),
}).refine(data => data.endKm >= data.startKm, {
  message: "I KM finali non possono essere inferiori ai KM iniziali.",
  path: ["endKm"],
});

const ServiceReportForm = () => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      serviceDate: new Date(),
      employeeId: "",
      serviceLocation: "",
      serviceType: "",
      startTime: "08:00",
      endTime: "17:00",
      vehicleMakeModel: "",
      vehiclePlate: "",
      startKm: 0,
      endKm: 0,
      vehicleInitialState: "",
      bodyworkDamage: "",
      vehicleAnomalies: "",
      gps: false,
      radioVehicle: false,
      swivelingLamp: false,
      radioPortable: false,
      flashlight: false,
      extinguisher: false,
      spareTire: false,
      highVisibilityVest: false,
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    console.log("Rapporto Dotazioni di Servizio:", values);
    showSuccess("Rapporto salvato con successo!");
    // Qui potresti inviare i dati a un backend
    form.reset(); // Reset form after submission
  };

  const handleEmail = () => {
    const values = form.getValues();
    const subject = `Rapporto Dotazioni di Servizio - ${values.employeeId} - ${format(values.serviceDate, 'dd/MM/yyyy')}`;
    
    let body = `Dettagli Rapporto Dotazioni di Servizio:\n\n`;
    body += `Data: ${format(values.serviceDate, 'dd/MM/yyyy', { locale: it })}\n`;
    body += `Addetto: ${values.employeeId}\n`;
    body += `Località: ${values.serviceLocation}\n`;
    body += `Tipo Servizio: ${values.serviceType}\n`;
    body += `Orario: ${values.startTime} - ${values.endTime}\n\n`;
    
    body += `Dettagli Veicolo:\n`;
    body += `Modello: ${values.vehicleMakeModel}\n`;
    body += `Targa: ${values.vehiclePlate}\n`;
    body += `KM: ${values.startKm} - ${values.endKm}\n`;
    body += `Stato Iniziale Veicolo: ${values.vehicleInitialState}\n`;
    body += `Danni Carrozzeria: ${values.bodyworkDamage || 'Nessuno'}\n`;
    body += `Anomalie Veicolo: ${values.vehicleAnomalies || 'Nessuna'}\n\n`;

    body += `Dotazioni:\n`;
    body += `GPS: ${values.gps ? 'Sì' : 'No'}\n`;
    body += `Radio Veicolare: ${values.radioVehicle ? 'Sì' : 'No'}\n`;
    body += `Faro Girevole: ${values.swivelingLamp ? 'Sì' : 'No'}\n`;
    body += `Radio Portatile: ${values.radioPortable ? 'Sì' : 'No'}\n`;
    body += `Torcia: ${values.flashlight ? 'Sì' : 'No'}\n`;
    body += `Estintore: ${values.extinguisher ? 'Sì' : 'No'}\n`;
    body += `Ruota di Scorta: ${values.spareTire ? 'Sì' : 'No'}\n`;
    body += `Giubbotto Alta Visibilità: ${values.highVisibilityVest ? 'Sì' : 'No'}\n`;

    sendEmail(subject, body);
  };

  const handlePrintPdf = () => {
    try {
      const values = form.getValues();
      const doc = new jsPDF();
      
      // Intestazione
      doc.setFontSize(18);
      doc.text("RAPPORTO DOTAZIONI DI SERVIZIO", 105, 15, { align: 'center' });
      
      // Contenuto
      let y = 30;
      doc.setFontSize(12);
      
      // Sezione Dettagli
      doc.text(`• Data: ${format(values.serviceDate, 'dd/MM/yyyy', { locale: it })}`, 14, y);
      y += 7;
      doc.text(`• Addetto: ${values.employeeId}`, 14, y);
      y += 7;
      doc.text(`• Località: ${values.serviceLocation}`, 14, y);
      y += 7;
      doc.text(`• Tipo servizio: ${values.serviceType}`, 14, y);
      y += 7;
      doc.text(`• Orario: ${values.startTime} - ${values.endTime}`, 14, y);
      y += 10;

      // Sezione Veicolo
      doc.setFontSize(14);
      doc.text("VEICOLO", 14, y);
      y += 7;
      doc.setFontSize(12);
      doc.text(`- Modello: ${values.vehicleMakeModel}`, 20, y);
      y += 7;
      doc.text(`- Targa: ${values.vehiclePlate}`, 20, y);
      y += 7;
      doc.text(`- KM: ${values.startKm} → ${values.endKm}`, 20, y);
      y += 7;
      doc.text(`- Stato iniziale: ${values.vehicleInitialState}`, 20, y);
      y += 7;
      doc.text(`- Danni carrozzeria: ${values.bodyworkDamage || 'Nessuno'}`, 20, y);
      y += 7;
      doc.text(`- Anomalie veicolo: ${values.vehicleAnomalies || 'Nessuna'}`, 20, y);
      y += 10;

      // Tabella Dotazioni
      const dotazioniData = [
        ['GPS', values.gps ? 'Sì' : 'No'],
        ['Radio veicolare', values.radioVehicle ? 'Sì' : 'No'],
        ['Faro girevole', values.swivelingLamp ? 'Sì' : 'No'],
        ['Radio portatile', values.radioPortable ? 'Sì' : 'No'],
        ['Torcia', values.flashlight ? 'Sì' : 'No'],
        ['Estintore', values.extinguisher ? 'Sì' : 'No'],
        ['Ruota di scorta', values.spareTire ? 'Sì' : 'No'],
        ['Giubbotto alta visibilità', values.highVisibilityVest ? 'Sì' : 'No']
      ];

      (doc as any).autoTable({
        startY: y,
        head: [['Dotazione', 'Presente']],
        body: dotazioniData,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185], textColor: [255, 255, 255] },
        styles: { fontSize: 10, cellPadding: 2 },
        margin: { left: 14, right: 14 },
      });

      doc.output('dataurlnewwindow');
      showSuccess("PDF generato correttamente!");
    } catch (error) {
      showError("Errore nella generazione del PDF");
      console.error(error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-4">
        <section className="p-4 border rounded-lg shadow-sm bg-card">
          <h2 className="text-xl font-semibold mb-4">Dettagli Servizio</h2>
          <FormField
            control={form.control}
            name="serviceDate"
            render={({ field }) => (
              <FormItem className="flex flex-col mb-4">
                <FormLabel>Data Servizio</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP", { locale: it })
                        ) : (
                          <span>Seleziona una data</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                      locale={it}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="employeeId"
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
                    {employeeNameOptions.map((option) => (
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
            name="serviceLocation"
            render={({ field }) => (
              <FormItem className="mb-4">
                <FormLabel>Località Servizio</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona una località" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {serviceLocationOptions.map((option) => (
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
            name="serviceType"
            render={({ field }) => (
              <FormItem className="mb-4">
                <FormLabel>Tipo Servizio</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona un tipo di servizio" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {serviceTypeOptions.map((option) => (
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="startTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ora Inizio</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="endTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ora Fine</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </section>

        <section className="p-4 border rounded-lg shadow-sm bg-card">
          <h2 className="text-xl font-semibold mb-4">Dettagli Veicolo</h2>
          <FormField
            control={form.control}
            name="vehicleMakeModel"
            render={({ field }) => (
              <FormItem className="mb-4">
                <FormLabel>Marca e Modello Veicolo</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona marca e modello" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {vehicleMakeModelOptions.map((option) => (
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
            name="vehiclePlate"
            render={({ field }) => (
              <FormItem className="mb-4">
                <FormLabel>Targa Veicolo</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona targa" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {vehiclePlateOptions.map((option) => (
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <FormField
              control={form.control}
              name="startKm"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>KM Iniziali</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0" {...field} onChange={e => field.onChange(e.target.valueAsNumber)} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="endKm"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>KM Finali</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0" {...field} onChange={e => field.onChange(e.target.valueAsNumber)} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="vehicleInitialState"
            render={({ field }) => (
              <FormItem className="mb-4">
                <FormLabel>Stato Iniziale Veicolo</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona stato" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {vehicleInitialStateOptions.map((option) => (
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
            name="bodyworkDamage"
            render={({ field }) => (
              <FormItem className="mb-4">
                <FormLabel>Danni Carrozzeria</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona danni" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {bodyworkDamageOptions.map((option) => (
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
            name="vehicleAnomalies"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Anomalie Veicolo</FormLabel>
                <FormControl>
                  <Textarea placeholder="Descrivi eventuali anomalie..." rows={3} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </section>

        <section className="p-4 border rounded-lg shadow-sm bg-card">
          <h2 className="text-xl font-semibold mb-4">Dotazioni</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="gps"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>GPS</FormLabel>
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="radioVehicle"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Radio Veicolare</FormLabel>
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="swivelingLamp"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Faro Girevole</FormLabel>
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="radioPortable"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Radio Portatile</FormLabel>
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="flashlight"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Torcia</FormLabel>
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="extinguisher"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Estintore</FormLabel>
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="spareTire"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Ruota di Scorta</FormLabel>
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="highVisibilityVest"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Giubbotto Alta Visibilità</FormLabel>
                  </div>
                </FormItem>
              )}
            />
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
          <Button 
            type="button" 
            variant="outline"
            onClick={handleEmail}
          >
            <Mail className="mr-2 h-4 w-4" /> Invia Email
          </Button>
          
          <Button 
            type="button"
            variant="outline" 
            onClick={handlePrintPdf}
          >
            <Printer className="mr-2 h-4 w-4" /> Stampa PDF
          </Button>
          
          <Button type="submit">
            <Save className="mr-2 h-4 w-4" /> Salva
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ServiceReportForm;