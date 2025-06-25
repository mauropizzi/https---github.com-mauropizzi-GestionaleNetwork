import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { showSuccess, showError, showInfo } from "@/utils/toast";
import { sendEmail } from "@/utils/email"; // Import the sendEmail utility
import jsPDF from 'jspdf'; // Import jsPDF
import 'jspdf-autotable'; // Import jspdf-autotable

// --- Schemas and Data (from original JS files) ---
const nameOptions = [
  "AGLIECO", "ARTINO", "BALISTRERI", "CACCAVELLI", "CARUSO G", "CASA'",
  "CASTIGLIONE", "COSTANTINO", "DI GAETANO M", "DI GAETANO S", "FANARA",
  "GAMBINO", "GRANATA", "GRASSO", "GUASTELLA M", "GUASTELLA S", "GULLOTTA",
  "GUTTADAURO", "MESSANA", "MESSINA A", "MESSINA D", "MINARDI", "MOTTA",
  "PALMERI", "PASSARE", "RAFFAELE", "SANA", "SCANDURRA", "SENA", "TOSCANO", "VASTA"
];

const serviceLocationOptions = [
  "Agrigento - Segmento Portierato", "Agrigento - Segmento VIGILANZA",
  "Caltanissetta - Segmento Portierato", "Caltanissetta - Segmento VIGILANZA",
  "Catania - Segmento Portierato", "Catania - Segmento VIGILANZA",
  "Enna - Segmento Portierato", "Enna - Segmento VIGILANZA",
  "Messina - Segmento Portierato", "Messina - Segmento VIGILANZA",
  "Palermo - Segmento Portierato", "Palermo - Segmento VIGILANZA",
  "Ragusa - Segmento Portierato", "Ragusa - Segmento VIGILANZA",
  "Siracusa - Segmento Portierato", "Siracusa - Segmento VIGILANZA",
  "Trapani - Segmento Portierato", "Trapani - Segmento VIGILANZA"
];

const serviceTypeOptions = ["G.P.G.", "A.S.F."];

const vehicleStateOptions = ["SCARSO", "SUFFICIENTE", "BUONO", "OTTIMO"];

const bodyworkDamageOptions = ["NESSUNO", "CARROZZERIA", "CRISTALLI", "GOMME", "MOTORE", "ALTRO"];

const accessoryOptions = ["SI", "NO"];

const formSchema = z.object({
  serviceDate: z.string().min(1, "La data del servizio è richiesta."),
  name: z.string().min(1, "Il nominativo è richiesto."),
  serviceLocation: z.string().min(1, "La località è richiesta."),
  serviceType: z.string().min(1, "La tipologia di servizio è richiesta."),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato ora inizio non valido (HH:MM)."),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato ora fine non valido (HH:MM)."),
  vehicleMakeModel: z.string().min(1, "Marca/Modello veicolo è richiesto."),
  vehiclePlate: z.string().min(1, "La targa è richiesta."),
  startKm: z.coerce.number().min(0, "KM Inizio deve essere un numero valido."),
  endKm: z.coerce.number().min(0, "KM Fine deve essere un numero valido."),
  vehicleInitialState: z.string().min(1, "Lo stato del veicolo è richiesto."),
  bodyworkDamage: z.string().optional(),
  vehicleAnomalies: z.string().optional(),
  gps: z.enum(["SI", "NO"], { required_error: "Seleziona lo stato del GPS." }),
  radioVehicle: z.enum(["SI", "NO"], { required_error: "Seleziona lo stato della Radio Veicolare." }),
  swivelingLamp: z.enum(["SI", "NO"], { required_error: "Seleziona lo stato del Faro Brandeggiante." }),
  radioPortable: z.enum(["SI", "NO"], { required_error: "Seleziona lo stato della Radio Portatile." }),
  flashlight: z.enum(["SI", "NO"], { required_error: "Seleziona lo stato della Torcia." }),
  extinguisher: z.enum(["SI", "NO"], { required_error: "Seleziona lo stato dell'Estintore." }),
  spareTire: z.enum(["SI", "NO"], { required_error: "Seleziona lo stato della Ruota di Scorta." }),
  highVisibilityVest: z.enum(["SI", "NO"], { required_error: "Seleziona lo stato del Gilet Alta Visibilità." }),
  startLatitude: z.coerce.number().optional(), // New field for start latitude
  startLongitude: z.coerce.number().optional(), // New field for start longitude
  endLatitude: z.coerce.number().optional(), // New field for end latitude
  endLongitude: z.coerce.number().optional(), // New field for end longitude
}).refine(data => data.endKm >= data.startKm, {
  message: "KM Fine Servizio deve essere uguale o superiore a KM Inizio Servizio.",
  path: ["endKm"],
});

export function ServiceReportForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      serviceDate: format(new Date(), "yyyy-MM-dd"),
      name: "",
      serviceLocation: "",
      serviceType: "",
      startTime: format(new Date(), "HH:mm"),
      endTime: format(new Date(), "HH:mm"),
      vehicleMakeModel: "",
      vehiclePlate: "",
      startKm: 0,
      endKm: 0,
      vehicleInitialState: "",
      bodyworkDamage: "",
      vehicleAnomalies: "",
      gps: undefined,
      radioVehicle: undefined,
      swivelingLamp: undefined,
      radioPortable: undefined,
      flashlight: undefined,
      extinguisher: undefined,
      spareTire: undefined,
      highVisibilityVest: undefined,
      startLatitude: undefined, // Default for new field
      startLongitude: undefined, // Default for new field
      endLatitude: undefined, // Default for new field
      endLongitude: undefined, // Default for new field
    },
  });

  const [vehicleOptions, setVehicleOptions] = useState<string[]>([]);
  const [plateOptions, setPlateOptions] = useState<string[]>([]);

  useEffect(() => {
    // Populate vehicle options (BETA 10 to BETA 50)
    const generatedVehicles = [];
    for (let i = 10; i <= 50; i++) {
      generatedVehicles.push(`BETA ${i}`);
    }
    setVehicleOptions(generatedVehicles);

    // Populate plate options (from original index.html)
    setPlateOptions([
      "GB317FW", "DH484KW", "EL438RT", "EF968TN", "EV662DB", "EV131XY",
      "FD133CT", "GB314FW", "GB315FW", "GB316FW", "EG885KT", "GC657WR",
      "GC658WR", "GK262JP", "GK264JP", "DC084FS", "DD064XN", "GK664JP",
      "FZ088GC", "FG127JY", "GK783JP", "FM693KX", "FF027CC", "FF076LE",
      "FF029LE", "FR736GC", "FF041CC", "GK784JP", "GK263JP", "GK785JP",
      "CV054ER"
    ]);
  }, []);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    console.log("Service Report Data:", values);
    showSuccess("Rapporto di servizio registrato con successo!");
    // Here you would integrate with backend or other services
    // For now, just logging and showing a toast.
    form.reset(); // Reset form after submission
  };

  const handleSetCurrentDate = () => {
    form.setValue("serviceDate", format(new Date(), "yyyy-MM-dd"));
  };

  const handleSetCurrentTime = (field: "startTime" | "endTime") => {
    form.setValue(field, format(new Date(), "HH:mm"));
  };

  const getGpsPosition = (type: 'start' | 'end') => {
    if (navigator.geolocation) {
      showInfo(`Acquisizione posizione ${type === 'start' ? 'inizio' : 'fine'} servizio...`);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          if (type === 'start') {
            form.setValue("startLatitude", latitude);
            form.setValue("startLongitude", longitude);
            showSuccess(`Posizione inizio servizio acquisita: Lat ${latitude.toFixed(6)}, Lon ${longitude.toFixed(6)}`);
          } else {
            form.setValue("endLatitude", latitude);
            form.setValue("endLongitude", longitude);
            showSuccess(`Posizione fine servizio acquisita: Lat ${latitude.toFixed(6)}, Lon ${longitude.toFixed(6)}`);
          }
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
    const subject = `Rapporto Dotazioni di Servizio - ${values.name} - ${format(new Date(values.serviceDate), 'dd/MM/yyyy')}`;
    
    let body = `Dettagli Rapporto Dotazioni di Servizio:\n\n`;
    body += `Data Servizio: ${format(new Date(values.serviceDate), 'dd/MM/yyyy')}\n`;
    body += `Nominativo Dipendente: ${values.name}\n`;
    body += `Provincia SEGMENTO: ${values.serviceLocation}\n`;
    body += `Tipologia di Servizio: ${values.serviceType === "G.P.G." ? "Guardia Particolare Giurata" : "Addetto Servizi Fiduciari"}\n`;
    body += `Inizio Servizio: ${values.startTime}\n`;
    if (values.startLatitude !== undefined && values.startLongitude !== undefined) {
      body += `Posizione Inizio (Lat, Lon): ${values.startLatitude.toFixed(6)}, ${values.startLongitude.toFixed(6)}\n`;
    }
    body += `Fine Servizio: ${values.endTime}\n`;
    if (values.endLatitude !== undefined && values.endLongitude !== undefined) {
      body += `Posizione Fine (Lat, Lon): ${values.endLatitude.toFixed(6)}, ${values.endLongitude.toFixed(6)}\n`;
    }
    body += `\n--- Dettagli Veicolo ---\n`;
    body += `Marca/Modello Veicolo: ${values.vehicleMakeModel}\n`;
    body += `Targa: ${values.vehiclePlate}\n`;
    body += `KM Inizio Servizio: ${values.startKm}\n`;
    body += `KM Fine Servizio: ${values.endKm}\n`;
    body += `Stato del Veicolo ad Avvio Servizio: ${values.vehicleInitialState}\n`;
    body += `Eventuali Danni: ${values.bodyworkDamage || 'Nessuno'}\n`;
    body += `Dettaglio Anomalie Automezzo: ${values.vehicleAnomalies || 'Nessuna'}\n`;
    
    body += `\n--- Controllo Accessori ---\n`;
    body += `GPS: ${values.gps}\n`;
    body += `Apparato Radio Veicolare: ${values.radioVehicle}\n`;
    body += `Faro Brandeggiante: ${values.swivelingLamp}\n`;
    body += `Apparato Radio Portatile: ${values.radioPortable}\n`;
    body += `Torcia Portatile: ${values.flashlight}\n`;
    body += `Estintore: ${values.extinguisher}\n`;
    body += `Ruota di Scorta: ${values.spareTire}\n`;
    body += `Gilet Alta Visibilità: ${values.highVisibilityVest}\n`;

    sendEmail(subject, body);
  };

  const handlePrintPdf = () => {
    console.log("Tentativo di generazione PDF per Rapporto Dotazioni di Servizio..."); // Debug log
    showInfo("Generazione PDF per il rapporto di servizio..."); // Updated toast message

    const doc = new jsPDF();
    doc.text("Questo è un PDF di prova.", 10, 10); // Simple text for testing

    doc.output('dataurlnewwindow'); // Open in new tab
    showSuccess("PDF di prova generato con successo!");
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-4">
        {/* Removed the h1 tag from here */}

        {/* Generalità Section */}
        <section className="p-4 border rounded-lg shadow-sm bg-card">
          <h2 className="text-xl font-semibold mb-4">Generalità</h2>
          <FormField
            control={form.control}
            name="serviceDate"
            render={({ field }) => (
              <FormItem className="mb-4">
                <FormLabel>Data del Servizio</FormLabel>
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
            name="name"
            render={({ field }) => (
              <FormItem className="mb-4">
                <FormLabel>Nominativo Dipendente</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    placeholder="Inizia a digitare per cercare..."
                    list="nameOptions"
                    autoComplete="off"
                    {...field}
                  />
                </FormControl>
                <datalist id="nameOptions">
                  {nameOptions.map((option) => (
                    <option key={option} value={option} />
                  ))}
                </datalist>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="serviceLocation"
            render={({ field }) => (
              <FormItem className="mb-4">
                <FormLabel>Provincia SEGMENTO</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona..." />
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
                <FormLabel>Tipologia di Servizio</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {serviceTypeOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option === "G.P.G." ? "Guardia Particolare Giurata" : "Addetto Servizi Fiduciari"}
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
                  <FormLabel>Inizio Servizio</FormLabel>
                  <div className="flex items-center space-x-2">
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <Button type="button" variant="outline" onClick={() => handleSetCurrentTime("startTime")}>
                      Ora Attuale
                    </Button>
                  </div>
                  <Button type="button" className="w-full mt-2 bg-red-600 hover:bg-red-700" onClick={() => getGpsPosition("start")}>
                    POSIZIONE inizio Servizio
                  </Button>
                  {form.watch("startLatitude") !== undefined && form.watch("startLongitude") !== undefined && (
                    <p className="text-sm text-gray-500 mt-1">
                      Lat: {form.watch("startLatitude")?.toFixed(6)}, Lon: {form.watch("startLongitude")?.toFixed(6)}
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="endTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fine Servizio</FormLabel>
                  <div className="flex items-center space-x-2">
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <Button type="button" variant="outline" onClick={() => handleSetCurrentTime("endTime")}>
                      Ora Attuale
                    </Button>
                  </div>
                  <Button type="button" className="w-full mt-2 bg-purple-600 hover:bg-purple-700" onClick={() => getGpsPosition("end")}>
                    POSIZIONE Fine Servizio
                  </Button>
                  {form.watch("endLatitude") !== undefined && form.watch("endLongitude") !== undefined && (
                    <p className="text-sm text-gray-500 mt-1">
                      Lat: {form.watch("endLatitude")?.toFixed(6)}, Lon: {form.watch("endLongitude")?.toFixed(6)}
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </section>

        {/* Veicolo Section */}
        <section className="p-4 border rounded-lg shadow-sm bg-card">
          <h2 className="text-xl font-semibold mb-4">Veicolo</h2>
          <FormField
            control={form.control}
            name="vehicleMakeModel"
            render={({ field }) => (
              <FormItem className="mb-4">
                <FormLabel>Marca/Modello</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    placeholder="Cerca veicolo (es. BETA 10)..."
                    list="vehicleOptions"
                    autoComplete="off"
                    {...field}
                  />
                </FormControl>
                <datalist id="vehicleOptions">
                  {vehicleOptions.map((option) => (
                    <option key={option} value={option} />
                  ))}
                </datalist>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="vehiclePlate"
            render={({ field }) => (
              <FormItem className="mb-4">
                <FormLabel>Targa</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    placeholder="Cerca targa..."
                    list="plateOptions"
                    {...field}
                  />
                </FormControl>
                <datalist id="plateOptions">
                  {plateOptions.map((option) => (
                    <option key={option} value={option} />
                  ))}
                </datalist>
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
                  <FormLabel>KM Inizio Servizio</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
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
                    <Input type="number" {...field} />
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
                <FormLabel>Stato del Veicolo ad Avvio Servizio</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {vehicleStateOptions.map((option) => (
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
                <FormLabel>Eventuali Danni</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona..." />
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
                <FormLabel>Eventuale Dettaglio Anomalie Automezzo</FormLabel>
                <FormControl>
                  <Textarea placeholder="Descrivi eventuali anomalie..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </section>

        {/* Controllo Accessori Section */}
        <section className="p-4 border rounded-lg shadow-sm bg-card">
          <h2 className="text-xl font-semibold mb-4">Controllo Accessori</h2>
          <div className="grid grid-cols-1 gap-4">
            {[
              { name: "gps", label: "GPS" },
              { name: "radioVehicle", label: "Apparato Radio Veicolare" },
              { name: "swivelingLamp", label: "Faro Brandeggiante" },
              { name: "radioPortable", label: "Apparato Radio Portatile" },
              { name: "flashlight", label: "Torcia Portatile" },
              { name: "extinguisher", label: "Estintore" },
              { name: "spareTire", label: "Ruota di Scorta" },
              { name: "highVisibilityVest", label: "Gilet Alta Visibilità" },
            ].map((accessory) => (
              <FormField
                key={accessory.name}
                control={form.control}
                name={accessory.name as "gps"} // Type assertion for union type
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-md border p-4">
                    <FormLabel className="!mt-0 font-medium text-base">{accessory.label}</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex space-x-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="SI" id={`${accessory.name}SI`} />
                          <Label htmlFor={`${accessory.name}SI`} className="bg-green-100 text-green-700 px-3 py-1 rounded-md cursor-pointer">SI</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="NO" id={`${accessory.name}NO`} />
                          <Label htmlFor={`${accessory.name}NO`} className="bg-red-100 text-red-700 px-3 py-1 rounded-md cursor-pointer">NO</Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
          </div>
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

        {/* History Section (Placeholder) */}
        <section className="p-4 border rounded-lg shadow-sm bg-card mt-6">
          <h2 className="text-xl font-semibold mb-4">Storico dei Rapporti di Servizio</h2>
          <div className="text-center text-gray-500">
            Lo storico dei rapporti verrà visualizzato qui (funzionalità da implementare).
          </div>
        </section>
      </form>
    </Form>
  );
}