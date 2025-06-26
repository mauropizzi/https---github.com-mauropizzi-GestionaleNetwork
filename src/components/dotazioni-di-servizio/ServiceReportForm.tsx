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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
      name: "",
      serviceLocation: "",
      serviceType: "G.P.G.",
      startTime: "",
      endTime: "",
      vehicleMakeModel: "",
      vehiclePlate: "",
      startKm: 0,
      endKm: 0,
      vehicleInitialState: "",
      bodyworkDamage: "",
      vehicleAnomalies: "",
      gps: true,
      radioVehicle: true,
      swivelingLamp: true,
      radioPortable: true,
      flashlight: true,
      extinguisher: true,
      spareTire: true,
      highVisibilityVest: true,
      startLatitude: undefined,
      startLongitude: undefined,
      endLatitude: undefined,
      endLongitude: undefined,
    },
  });

  const handleSetCurrentTime = (field: "startTime" | "endTime") => {
    form.setValue(field, format(new Date(), "HH:mm"));
  };

  const handleGpsTracking = (fieldPrefix: "start" | "end") => {
    if (navigator.geolocation) {
      showInfo(`Acquisizione posizione GPS ${fieldPrefix === 'start' ? 'di inizio' : 'di fine'} servizio...`);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          form.setValue(`${fieldPrefix}Latitude`, latitude);
          form.setValue(`${fieldPrefix}Longitude`, longitude);
          showSuccess(`Posizione GPS ${fieldPrefix === 'start' ? 'di inizio' : 'di fine'} acquisita: Lat ${latitude.toFixed(6)}, Lon ${longitude.toFixed(6)}`);
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

        <FormField
          control={form.control}
          name="serviceLocation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Provincia SEGMENTO</FormLabel>
              <FormControl>
                <Input placeholder="Es: Palermo, Catania" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="serviceType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipologia di Servizio</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona tipologia" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="G.P.G.">Guardia Particolare Giurata</SelectItem>
                  <SelectItem value="Addetto Servizi Fiduciari">Addetto Servizi Fiduciari</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="startTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Inizio Servizio (HH:MM)</FormLabel>
                <div className="flex items-center space-x-2">
                  <FormControl>
                    <Input type="time" placeholder="09:00" {...field} />
                  </FormControl>
                  <Button type="button" variant="outline" onClick={() => handleSetCurrentTime('startTime')}>
                    Ora Attuale
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="endTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fine Servizio (HH:MM)</FormLabel>
                <div className="flex items-center space-x-2">
                  <FormControl>
                    <Input type="time" placeholder="17:00" {...field} />
                  </FormControl>
                  <Button type="button" variant="outline" onClick={() => handleSetCurrentTime('endTime')}>
                    Ora Attuale
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <h3 className="text-lg font-semibold mt-6 mb-4">Dettagli Veicolo</h3>
        <FormField
          control={form.control}
          name="vehicleMakeModel"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Marca/Modello Veicolo</FormLabel>
              <FormControl>
                <Input placeholder="Es: Fiat Panda, Ford Transit" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="vehiclePlate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Targa</FormLabel>
              <FormControl>
                <Input placeholder="Es: AB123CD" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="startKm"
            render={({ field }) => (
              <FormItem>
                <FormLabel>KM Inizio Servizio</FormLabel>
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
                <FormLabel>KM Fine Servizio</FormLabel>
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
            <FormItem>
              <FormLabel>Stato del Veicolo ad Avvio Servizio</FormLabel>
              <FormControl>
                <Textarea placeholder="Descrivi lo stato iniziale del veicolo..." rows={3} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="bodyworkDamage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Eventuali Danni alla Carrozzeria</FormLabel>
              <FormControl>
                <Textarea placeholder="Descrivi eventuali danni..." rows={2} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="vehicleAnomalies"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dettaglio Anomalie Automezzo</FormLabel>
              <FormControl>
                <Textarea placeholder="Descrivi eventuali anomalie riscontrate..." rows={2} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <h3 className="text-lg font-semibold mt-6 mb-4">Controllo Accessori</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="gps"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <input type="checkbox" checked={field.value} onChange={field.onChange} className="h-4 w-4" />
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
              <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <input type="checkbox" checked={field.value} onChange={field.onChange} className="h-4 w-4" />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Apparato Radio Veicolare</FormLabel>
                </div>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="swivelingLamp"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <input type="checkbox" checked={field.value} onChange={field.onChange} className="h-4 w-4" />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Faro Brandeggiante</FormLabel>
                </div>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="radioPortable"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <input type="checkbox" checked={field.value} onChange={field.onChange} className="h-4 w-4" />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Apparato Radio Portatile</FormLabel>
                </div>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="flashlight"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <input type="checkbox" checked={field.value} onChange={field.onChange} className="h-4 w-4" />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Torcia Portatile</FormLabel>
                </div>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="extinguisher"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <input type="checkbox" checked={field.value} onChange={field.onChange} className="h-4 w-4" />
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
              <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <input type="checkbox" checked={field.value} onChange={field.onChange} className="h-4 w-4" />
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
              <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <input type="checkbox" checked={field.value} onChange={field.onChange} className="h-4 w-4" />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Gilet Alta Visibilità</FormLabel>
                </div>
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Button 
              type="button" 
              className="w-full bg-blue-600 hover:bg-blue-700" 
              onClick={() => handleGpsTracking('start')}
            >
              ACQUISIZIONE GPS INIZIO SERVIZIO
            </Button>
            {form.watch("startLatitude") !== undefined && form.watch("startLongitude") !== undefined && (
              <p className="text-sm text-gray-500 mt-1 text-center">
                Latitudine: {form.watch("startLatitude")?.toFixed(6)}, Longitudine: {form.watch("startLongitude")?.toFixed(6)}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Button 
              type="button" 
              className="w-full bg-blue-600 hover:bg-blue-700" 
              onClick={() => handleGpsTracking('end')}
            >
              ACQUISIZIONE GPS FINE SERVIZIO
            </Button>
            {form.watch("endLatitude") !== undefined && form.watch("endLongitude") !== undefined && (
              <p className="text-sm text-gray-500 mt-1 text-center">
                Latitudine: {form.watch("endLatitude")?.toFixed(6)}, Longitudine: {form.watch("endLongitude")?.toFixed(6)}
              </p>
            )}
          </div>
        </div>

        <div className="pt-4 flex justify-end gap-4">
          <Button type="button" onClick={handlePrintPdf}>
            Stampa PDF
          </Button>
          <Button type="submit">Salva Rapporto</Button>
        </div>
      </form>
    </Form>
  );
}