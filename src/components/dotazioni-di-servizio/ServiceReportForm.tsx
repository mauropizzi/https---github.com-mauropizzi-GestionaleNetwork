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
  gps: z.boolean().default(false),
  radioVehicle: z.boolean().default(false),
  swivelingLamp: z.boolean().default(false),
  radioPortable: z.boolean().default(false),
  flashlight: z.boolean().default(false),
  extinguisher: z.boolean().default(false),
  spareTire: z.boolean().default(false),
  highVisibilityVest: z.boolean().default(false),
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
      gps: false,
      radioVehicle: false,
      swivelingLamp: false,
      radioPortable: false,
      flashlight: false,
      extinguisher: false,
      spareTire: false,
      highVisibilityVest: false,
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

        <Button type="submit" className="w-full">
          Registra Rapporto
        </Button>
      </form>
    </Form>
  );
};

export default ServiceReportForm;