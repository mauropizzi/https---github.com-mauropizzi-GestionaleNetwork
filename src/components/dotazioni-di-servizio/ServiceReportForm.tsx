import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { it } from 'date-fns/locale';
import { CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
import { fetchPuntiServizio } from "@/lib/data-fetching";
import { PuntoServizio } from "@/lib/anagrafiche-data";
import { sendEmail } from "@/utils/email"; // Import sendEmail utility
import { RECIPIENT_EMAIL } from "@/lib/config"; // Import recipient email

const formSchema = z.object({
  serviceDate: z.date({
    required_error: "La data del servizio è richiesta.",
  }),
  employeeId: z.string().min(1, "L'addetto è richiesto."),
  serviceLocation: z.string().min(1, "La località del servizio è richiesta."),
  serviceType: z.string().min(1, "Il tipo di servizio è richiesto."),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato ora inizio non valido (HH:MM)."),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato ora fine non valido (HH:MM)."),
  vehicleMakeModel: z.string().min(1, "Marca/Modello veicolo richiesto."),
  vehiclePlate: z.string().min(1, "Targa veicolo richiesta."),
  startKm: z.coerce.number().min(0, "KM iniziali non validi."),
  endKm: z.coerce.number().min(0, "KM finali non validi."),
  vehicleInitialState: z.string().min(1, "Stato iniziale veicolo richiesto."),
  bodyworkDamage: z.string().optional(),
  vehicleAnomalies: z.string().optional(),
  gps: z.enum(["si", "no"]).optional(),
  radioVehicle: z.enum(["si", "no"]).optional(),
  swivelingLamp: z.enum(["si", "no"]).optional(),
  radioPortable: z.enum(["si", "no"]).optional(),
  flashlight: z.enum(["si", "no"]).optional(),
  extinguisher: z.enum(["si", "no"]).optional(),
  spareTire: z.enum(["si", "no"]).optional(),
  highVisibilityVest: z.enum(["si", "no"]).optional(),
  startLatitude: z.coerce.number().optional(),
  startLongitude: z.coerce.number().optional(),
  endLatitude: z.coerce.number().optional(),
  endLongitude: z.coerce.number().optional(),
}).refine(data => data.endKm >= data.startKm, {
  message: "I KM finali non possono essere inferiori ai KM iniziali.",
  path: ["endKm"],
});

const ServiceReportForm = () => {
  const [puntiServizio, setPuntiServizio] = useState<PuntoServizio[]>([]);

  useEffect(() => {
    const loadPuntiServizio = async () => {
      const fetchedPuntiServizio = await fetchPuntiServizio();
      setPuntiServizio(fetchedPuntiServizio);
    };
    loadPuntiServizio();
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      serviceDate: new Date(),
      employeeId: "",
      serviceLocation: "",
      serviceType: "",
      startTime: "09:00",
      endTime: "17:00",
      vehicleMakeModel: "",
      vehiclePlate: "",
      startKm: 0,
      endKm: 0,
      vehicleInitialState: "",
      bodyworkDamage: "",
      vehicleAnomalies: "",
      gps: undefined, // Default to undefined for empty state
      radioVehicle: undefined,
      swivelingLamp: undefined,
      radioPortable: undefined,
      flashlight: undefined,
      extinguisher: undefined,
      spareTire: undefined,
      highVisibilityVest: undefined,
      startLatitude: undefined,
      startLongitude: undefined,
      endLatitude: undefined,
      endLongitude: undefined,
    },
  });

  const handleSetCurrentTime = (field: "startTime" | "endTime") => {
    form.setValue(field, format(new Date(), "HH:mm"));
  };

  const handleGpsTracking = (type: "start" | "end") => {
    if (navigator.geolocation) {
      showInfo(`Acquisizione posizione GPS ${type === 'start' ? 'di inizio' : 'di fine'} servizio...`);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          if (type === "start") {
            form.setValue("startLatitude", latitude);
            form.setValue("startLongitude", longitude);
          } else {
            form.setValue("endLatitude", latitude);
            form.setValue("endLongitude", longitude);
          }
          showSuccess(`Posizione GPS ${type === 'start' ? 'di inizio' : 'di fine'} acquisita: Lat ${latitude.toFixed(6)}, Lon ${longitude.toFixed(6)}`);
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
    const subject = `Rapporto Dotazioni di Servizio - ${values.employeeId} - ${format(values.serviceDate, 'dd/MM/yyyy')}`;
    
    let body = `Dettagli Rapporto Dotazioni di Servizio:\n\n`;
    body += `Data Servizio: ${format(values.serviceDate, 'dd/MM/yyyy', { locale: it })}\n`;
    body += `Addetto: ${values.employeeId}\n`;
    body += `Località Servizio: ${values.serviceLocation}\n`;
    body += `Tipo di Servizio: ${values.serviceType}\n`;
    body += `Orario Inizio Servizio: ${values.startTime}\n`;
    if (values.startLatitude !== undefined && values.startLongitude !== undefined) {
      body += `  GPS Inizio: Lat ${values.startLatitude.toFixed(6)}, Lon ${values.startLongitude.toFixed(6)}\n`;
    }
    body += `Orario Fine Servizio: ${values.endTime}\n`;
    if (values.endLatitude !== undefined && values.endLongitude !== undefined) {
      body += `  GPS Fine: Lat ${values.endLongitude.toFixed(6)}, Lon ${values.endLongitude.toFixed(6)}\n`;
    }
    body += `\nDettagli Veicolo:\n`;
    body += `  Marca/Modello: ${values.vehicleMakeModel}\n`;
    body += `  Targa: ${values.vehiclePlate}\n`;
    body += `  KM Iniziali: ${values.startKm}\n`;
    body += `  KM Finali: ${values.endKm}\n`;
    body += `  Stato Iniziale: ${values.vehicleInitialState}\n`;
    body += `  Danni Carrozzeria: ${values.bodyworkDamage || 'Nessuno'}\n`;
    body += `  Anomalie Veicolo: ${values.vehicleAnomalies || 'Nessuna'}\n`;

    body += `\nDotazioni:\n`;
    body += `  GPS: ${values.gps ? (values.gps === 'si' ? 'Sì' : 'No') : 'N/A'}\n`;
    body += `  Radio Veicolare: ${values.radioVehicle ? (values.radioVehicle === 'si' ? 'Sì' : 'No') : 'N/A'}\n`;
    body += `  Faro Girevole: ${values.swivelingLamp ? (values.swivelingLamp === 'si' ? 'Sì' : 'No') : 'N/A'}\n`;
    body += `  Radio Portatile: ${values.radioPortable ? (values.radioPortable === 'si' ? 'Sì' : 'No') : 'N/A'}\n`;
    body += `  Torcia: ${values.flashlight ? (values.flashlight === 'si' ? 'Sì' : 'No') : 'N/A'}\n`;
    body += `  Estintore: ${values.extinguisher ? (values.extinguisher === 'si' ? 'Sì' : 'No') : 'N/A'}\n`;
    body += `  Ruota di Scorta: ${values.spareTire ? (values.spareTire === 'si' ? 'Sì' : 'No') : 'N/A'}\n`;
    body += `  Giubbotto Alta Visibilità: ${values.highVisibilityVest ? (values.highVisibilityVest === 'si' ? 'Sì' : 'No') : 'N/A'}\n`;

    sendEmail(subject, body);
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    console.log("Rapporto Dotazioni di Servizio Data:", values);
    showSuccess("Rapporto dotazioni di servizio registrato con successo!");
    form.reset();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-4">
        {/* Sezione Dettagli Servizio */}
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
                    {employeeNameOptions.map((employee) => (
                      <SelectItem key={employee} value={employee}>
                        {employee}
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
                      <SelectValue placeholder="Seleziona la località del servizio" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {serviceLocationOptions.map((location) => (
                      <SelectItem key={location} value={location}>
                        {location}
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
                <FormLabel>Tipo di Servizio</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona il tipo di servizio" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {serviceTypeOptions.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Campo Inizio Servizio con pulsante GPS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
            <div>
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
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleSetCurrentTime('startTime')}
                      >
                        Ora Attuale
                      </Button>
                    </div>
                    <div className="mt-2">
                      <Button
                        type="button"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => handleGpsTracking('start')}
                        id="startGps"
                      >
                        ACQUISIZIONE GPS INIZIO SERVIZIO
                      </Button>
                      {form.watch("startLatitude") && form.watch("startLongitude") && (
                        <p className="text-xs text-gray-500 mt-1 text-center">
                          Posizione registrata: {form.watch("startLatitude")?.toFixed(6)}, {form.watch("startLongitude")?.toFixed(6)}
                        </p>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Campo Fine Servizio con pulsante GPS */}
            <div>
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
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleSetCurrentTime('endTime')}
                      >
                        Ora Attuale
                      </Button>
                    </div>
                    <div className="mt-2">
                      <Button
                        type="button"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => handleGpsTracking('end')}
                        id="endGps"
                      >
                        ACQUISIZIONE GPS FINE SERVIZIO
                      </Button>
                      {form.watch("endLatitude") && form.watch("endLongitude") && (
                        <p className="text-xs text-gray-500 mt-1 text-center">
                          Posizione registrata: {form.watch("endLatitude")?.toFixed(6)}, {form.watch("endLongitude")?.toFixed(6)}
                        </p>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </section>

        {/* Sezione Dettagli Veicolo */}
        <section className="p-4 border rounded-lg shadow-sm bg-card">
          <h2 className="text-xl font-semibold mb-4">Dettagli Veicolo</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <FormField
              control={form.control}
              name="vehicleMakeModel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Marca/Modello Veicolo</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona marca/modello" />
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
                <FormItem>
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
          </div>
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
                      <SelectValue placeholder="Seleziona stato iniziale" />
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
                      <SelectValue placeholder="Seleziona danni carrozzeria" />
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
                  <Textarea placeholder="Descrivi eventuali anomalie riscontrate..." rows={3} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </section>

        {/* Sezione Dotazioni */}
        <section className="p-4 border rounded-lg shadow-sm bg-card">
          <h2 className="text-xl font-semibold mb-4">Dotazioni</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="gps"
              render={({ field }) => (
                <FormItem className="flex flex-col space-y-2 rounded-md border p-4">
                  <FormLabel>GPS</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="flex space-x-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="si" id="gps-si" />
                        <Label htmlFor="gps-si">Sì</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="gps-no" />
                        <Label htmlFor="gps-no">No</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="radioVehicle"
              render={({ field }) => (
                <FormItem className="flex flex-col space-y-2 rounded-md border p-4">
                  <FormLabel>Radio Veicolare</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="flex space-x-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="si" id="radioVehicle-si" />
                        <Label htmlFor="radioVehicle-si">Sì</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="radioVehicle-no" />
                        <Label htmlFor="radioVehicle-no">No</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="swivelingLamp"
              render={({ field }) => (
                <FormItem className="flex flex-col space-y-2 rounded-md border p-4">
                  <FormLabel>Faro Girevole</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="flex space-x-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="si" id="swivelingLamp-si" />
                        <Label htmlFor="swivelingLamp-si">Sì</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="swivelingLamp-no" />
                        <Label htmlFor="swivelingLamp-no">No</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="radioPortable"
              render={({ field }) => (
                <FormItem className="flex flex-col space-y-2 rounded-md border p-4">
                  <FormLabel>Radio Portatile</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="flex space-x-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="si" id="radioPortable-si" />
                        <Label htmlFor="radioPortable-si">Sì</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="radioPortable-no" />
                        <Label htmlFor="radioPortable-no">No</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="flashlight"
              render={({ field }) => (
                <FormItem className="flex flex-col space-y-2 rounded-md border p-4">
                  <FormLabel>Torcia</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="flex space-x-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="si" id="flashlight-si" />
                        <Label htmlFor="flashlight-si">Sì</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="flashlight-no" />
                        <Label htmlFor="flashlight-no">No</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="extinguisher"
              render={({ field }) => (
                <FormItem className="flex flex-col space-y-2 rounded-md border p-4">
                  <FormLabel>Estintore</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="flex space-x-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="si" id="extinguisher-si" />
                        <Label htmlFor="extinguisher-si">Sì</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="extinguisher-no" />
                        <Label htmlFor="extinguisher-no">No</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="spareTire"
              render={({ field }) => (
                <FormItem className="flex flex-col space-y-2 rounded-md border p-4">
                  <FormLabel>Ruota di Scorta</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="flex space-x-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="si" id="spareTire-si" />
                        <Label htmlFor="spareTire-si">Sì</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="spareTire-no" />
                        <Label htmlFor="spareTire-no">No</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="highVisibilityVest"
              render={({ field }) => (
                <FormItem className="flex flex-col space-y-2 rounded-md border p-4">
                  <FormLabel>Giubbotto Alta Visibilità</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="flex space-x-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="si" id="highVisibilityVest-si" />
                        <Label htmlFor="highVisibilityVest-si">Sì</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="highVisibilityVest-no" />
                        <Label htmlFor="highVisibilityVest-no">No</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </section>

        <div className="pt-4 flex gap-4">
          <Button type="button" className="w-full bg-blue-600 hover:bg-blue-700" onClick={handleEmail}>
            INVIA EMAIL
          </Button>
          <Button type="submit" className="w-full">
            Registra Rapporto
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ServiceReportForm;