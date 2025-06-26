import React from "react";
import { useForm } from "react-hook-form";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { showSuccess, showError, showInfo } from "@/utils/toast";
import jsPDF from "jspdf";

interface ServiceReportFormValues {
  serviceDate: Date;
  name: string;
  serviceLocation: string;
  serviceType: string;
  startTime: string;
  endTime: string;
  vehicleMakeModel: string;
  vehiclePlate: string;
  startKm: number;
  endKm: number;
  vehicleInitialState: string;
  bodyworkDamage: string;
  vehicleAnomalies: string;
  gps: boolean;
  radioVehicle: boolean;
  swivelingLamp: boolean;
  radioPortable: boolean;
  flashlight: boolean;
  extinguisher: boolean;
  spareTire: boolean;
  highVisibilityVest: boolean;
  startLatitude?: number;
  startLongitude?: number;
  endLatitude?: number;
  endLongitude?: number;
}

export function ServiceReportForm() {
  const form = useForm<ServiceReportFormValues>({
    defaultValues: {
      serviceDate: new Date(),
      serviceType: "G.P.G.",
      gps: true,
      radioVehicle: true,
      swivelingLamp: true,
      radioPortable: true,
      flashlight: true,
      extinguisher: true,
      spareTire: true,
      highVisibilityVest: true,
    },
  });

  const handlePrintPdf = () => {
    const values = form.getValues();
    
    const doc = new jsPDF();
    let y = 20;

    doc.setFontSize(18);
    doc.text("Rapporto Dotazioni di Servizio", 14, y);
    y += 10;

    doc.setFontSize(10);
    doc.text(`Data Servizio: ${format(values.serviceDate, 'dd/MM/yyyy')}`, 14, y);
    y += 7;
    doc.text(`Nominativo Dipendente: ${values.name}`, 14, y);
    y += 7;
    doc.text(`Provincia SEGMENTO: ${values.serviceLocation}`, 14, y);
    y += 7;
    doc.text(`Tipologia di Servizio: ${values.serviceType === "G.P.G." ? "Guardia Particolare Giurata" : "Addetto Servizi Fiduciari"}`, 14, y);
    y += 7;
    doc.text(`Inizio Servizio: ${values.startTime}`, 14, y);
    y += 7;
    doc.text(`Fine Servizio: ${values.endTime}`, 14, y);
    y += 10;

    doc.setFontSize(12);
    doc.text("Dettagli Veicolo:", 14, y);
    y += 7;
    doc.setFontSize(10);
    doc.text(`Marca/Modello Veicolo: ${values.vehicleMakeModel}`, 14, y);
    y += 7;
    doc.text(`Targa: ${values.vehiclePlate}`, 14, y);
    y += 7;
    doc.text(`KM Inizio Servizio: ${values.startKm}`, 14, y);
    y += 7;
    doc.text(`KM Fine Servizio: ${values.endKm}`, 14, y);
    y += 7;
    doc.text(`Stato del Veicolo ad Avvio Servizio: ${values.vehicleInitialState}`, 14, y);
    y += 7;
    doc.text(`Eventuali Danni: ${values.bodyworkDamage || 'Nessuno'}`, 14, y);
    y += 7;
    doc.text(`Dettaglio Anomalie Automezzo: ${values.vehicleAnomalies || 'Nessuna'}`, 14, y);
    y += 10;

    doc.setFontSize(12);
    doc.text("Controllo Accessori:", 14, y);
    y += 7;
    
    const accessories = [
      { name: "GPS", value: values.gps ? "Presente" : "Assente" },
      { name: "Apparato Radio Veicolare", value: values.radioVehicle ? "Presente" : "Assente" },
      { name: "Faro Brandeggiante", value: values.swivelingLamp ? "Presente" : "Assente" },
      { name: "Apparato Radio Portatile", value: values.radioPortable ? "Presente" : "Assente" },
      { name: "Torcia Portatile", value: values.flashlight ? "Presente" : "Assente" },
      { name: "Estintore", value: values.extinguisher ? "Presente" : "Assente" },
      { name: "Ruota di Scorta", value: values.spareTire ? "Presente" : "Assente" },
      { name: "Gilet Alta Visibilità", value: values.highVisibilityVest ? "Presente" : "Assente" }
    ];

    accessories.forEach(accessory => {
      doc.text(`${accessory.name}: ${accessory.value}`, 14, y);
      y += 7;
    });

    if (values.startLatitude && values.startLongitude) {
      y += 5;
      doc.text(`Posizione GPS Inizio Servizio: Lat ${values.startLatitude.toFixed(6)}, Lon ${values.startLongitude.toFixed(6)}`, 14, y);
      y += 7;
    }

    if (values.endLatitude && values.endLongitude) {
      doc.text(`Posizione GPS Fine Servizio: Lat ${values.endLatitude.toFixed(6)}, Lon ${values.endLongitude.toFixed(6)}`, 14, y);
      y += 7;
    }

    y += 10;
    doc.setFontSize(8);
    doc.text(`Generato il: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, y);
    doc.text("Security App - Sistema di Gestione Servizi", 14, doc.internal.pageSize.height - 10);

    doc.output('dataurlnewwindow');
    showSuccess("PDF del rapporto di servizio generato con successo!");
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(() => {})} className="space-y-6 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="serviceDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
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
                          format(field.value, "PPP")
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
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nominativo Dipendente</FormLabel>
                <FormControl>
                  <Input placeholder="Nome e cognome" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Other form fields would go here */}

        <div className="flex justify-end gap-4">
          <Button type="button" onClick={handlePrintPdf}>
            Stampa PDF
          </Button>
          <Button type="submit">Salva Rapporto</Button>
        </div>
      </form>
    </Form>
  );
}