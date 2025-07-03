import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { it } from 'date-fns/locale';
import { CalendarIcon, Check, ChevronsUpDown } from "lucide-react";
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { showSuccess, showError, showInfo } from "@/utils/toast";
import { sendEmail } from "@/utils/email";
import { RECIPIENT_EMAIL } from "@/lib/config";
import { supabase } from "@/integrations/supabase/client";
import {
  serviceTypeOptions,
  vehicleMakeModelOptions,
  vehiclePlateOptions,
  vehicleInitialStateOptions,
  vehicleDamageOptions, // Updated import
} from "@/lib/dotazioni-data";
import { Personale, PuntoServizio } from "@/lib/anagrafiche-data";
import { fetchPersonale, fetchPuntiServizio } from "@/lib/data-fetching";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";

const formSchema = z.object({
  serviceDate: z.date({
    required_error: "La data del servizio è richiesta.",
  }),
  employeeId: z.string().uuid("Seleziona un dipendente valido.").nonempty("Il dipendente è richiesto."),
  servicePointId: z.string().uuid("Seleziona un punto servizio valido.").nonempty("Il punto servizio è richiesto."),
  serviceType: z.string().min(1, "Il tipo di servizio è richiesto."),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato ora inizio non valido (HH:MM)."),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato ora fine non valido (HH:MM)."),
  vehicleMakeModel: z.string().min(1, "Marca/Modello veicolo è richiesto."),
  vehiclePlate: z.string().min(1, "Targa veicolo è richiesta."),
  startKm: z.coerce.number().min(0, "KM iniziali non validi."),
  endKm: z.coerce.number().min(0, "KM finali non validi."),
  vehicleInitialState: z.string().min(1, "Stato iniziale veicolo è richiesto."),
  danniVeicolo: z.string().min(1, "Danni veicolo è richiesto."), // Renamed from bodyworkDamage
  vehicleAnomalies: z.string().optional(),
  gps: z.enum(['si', 'no'], { required_error: 'Il campo GPS è obbligatorio.' }),
  radioVehicle: z.enum(['si', 'no'], { required_error: 'Il campo Radio Veicolare è obbligatorio.' }),
  swivelingLamp: z.enum(['si', 'no'], { required_error: 'Il campo Faro Girevole è obbligatorio.' }),
  radioPortable: z.enum(['si', 'no'], { required_error: 'Il campo Radio Portatile è obbligatorio.' }),
  flashlight: z.enum(['si', 'no'], { required_error: 'Il campo Torcia è obbligatorio.' }),
  extinguisher: z.enum(['si', 'no'], { required_error: 'Il campo Estintore è obbligatorio.' }),
  spareTire: z.enum(['si', 'no'], { required_error: 'Il campo Ruota di Scorta è obbligatorio.' }),
  highVisibilityVest: z.enum(['si', 'no'], { required_error: 'Il campo Giubbotto Alta Visibilità è obbligatorio.' }),
}).refine(data => data.endKm >= data.startKm, {
  message: "I KM finali non possono essere inferiori ai KM iniziali.",
  path: ["endKm"],
});

export default function ServiceReportForm() {
  const [personaleList, setPersonaleList] = useState<Personale[]>([]);
  const [puntiServizioList, setPuntiServizioList] = useState<PuntoServizio[]>([]);
  const [isEmployeeSelectOpen, setIsEmployeeSelectOpen] = useState(false);
  const [isServicePointSelectOpen, setIsServicePointSelectOpen] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const fetchedPersonale = await fetchPersonale();
      setPersonaleList(fetchedPersonale);
      const fetchedPuntiServizio = await fetchPuntiServizio();
      setPuntiServizioList(fetchedPuntiServizio);
    };
    loadData();
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      serviceDate: new Date(),
      employeeId: "",
      servicePointId: "",
      serviceType: "",
      startTime: "09:00",
      endTime: "17:00",
      vehicleMakeModel: "",
      vehiclePlate: "",
      startKm: 0,
      endKm: 0,
      vehicleInitialState: "",
      danniVeicolo: "", // Updated field name
      vehicleAnomalies: "",
      gps: undefined,
      radioVehicle: undefined,
      swivelingLamp: undefined,
      radioPortable: undefined,
      flashlight: undefined,
      extinguisher: undefined,
      spareTire: undefined,
      highVisibilityVest: undefined,
    },
  });

  const selectedVehiclePlate = form.watch("vehiclePlate");
  const vehicleInitialState = form.watch("vehicleInitialState");

  useEffect(() => {
    const fetchLastKm = async () => {
      if (selectedVehiclePlate) {
        const { data, error } = await supabase
          .from('rapporti_servizio')
          .select('end_km')
          .eq('vehicle_plate', selectedVehiclePlate)
          .order('service_date', { ascending: false })
          .order('end_time', { ascending: false })
          .limit(1)
          .single();

        if (error && error.code !== 'PGRST116') {
          showError(`Errore nel recupero dei KM precedenti: ${error.message}`);
          console.error("Error fetching last KM:", error);
        } else if (data) {
          form.setValue("startKm", data.end_km, { shouldValidate: true });
          showInfo(`KM Iniziali pre-compilati con l'ultimo KM finale (${data.end_km}) per la targa ${selectedVehiclePlate}.`);
        } else {
          form.setValue("startKm", 0, { shouldValidate: true });
          showInfo(`Nessun KM precedente trovato per la targa ${selectedVehiclePlate}. KM Iniziali impostati a 0.`);
        }
      } else {
        form.setValue("startKm", 0, { shouldValidate: true });
      }
    };

    fetchLastKm();
  }, [selectedVehiclePlate, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    console.log("Dati Rapporto di Servizio:", values);

    const selectedServicePoint = puntiServizioList.find(p => p.id === values.servicePointId);
    const servicePointName = selectedServicePoint?.nome_punto_servizio || 'N/A';

    const payload = {
      service_date: format(values.serviceDate, 'yyyy-MM-dd'),
      employee_id: values.employeeId,
      service_location: servicePointName,
      service_type: values.serviceType,
      start_time: values.startTime,
      end_time: values.endTime,
      vehicle_make_model: values.vehicleMakeModel,
      vehicle_plate: values.vehiclePlate,
      start_km: values.startKm,
      end_km: values.endKm,
      vehicle_initial_state: values.vehicleInitialState,
      danni_veicolo: values.danniVeicolo, // Updated field name
      vehicle_anomalies: values.vehicleAnomalies || null,
      gps: values.gps === 'si',
      radio_vehicle: values.radioVehicle === 'si',
      swiveling_lamp: values.swivelingLamp === 'si',
      radio_portable: values.radioPortable === 'si',
      flashlight: values.flashlight === 'si',
      extinguisher: values.extinguisher === 'si',
      spare_tire: values.spareTire === 'si',
      high_visibility_vest: values.highVisibilityVest === 'si',
    };

    const { data, error } = await supabase
      .from('rapporti_servizio')
      .insert([payload]);

    if (error) {
      showError(`Errore durante la registrazione del rapporto: ${error.message}`);
      console.error("Error inserting service report:", error);
    } else {
      showSuccess("Rapporto di servizio registrato con successo!");
      console.log("Service report saved successfully:", data);
      form.reset();
    }
  };

  const handleSetCurrentTime = (field: "startTime" | "endTime") => {
    form.setValue(field, format(new Date(), "HH:mm"));
  };

  const handleGpsTracking = () => {
    showInfo("Funzionalità GPS non implementata per questo rapporto.");
  };

  const generatePdfBlob = async (values: z.infer<typeof formSchema>): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const doc = new jsPDF();
      let y = 20;

      doc.setFontSize(18);
      doc.text("Rapporto Dotazioni di Servizio", 14, y);
      y += 10;

      doc.setFontSize(10);
      const employeeName = personaleList.find(p => p.id === values.employeeId);
      const employeeFullName = employeeName ? `${employeeName.nome} ${employeeName.cognome}` : 'N/A';
      const selectedServicePoint = puntiServizioList.find(p => p.id === values.servicePointId);
      const servicePointName = selectedServicePoint?.nome_punto_servizio || 'N/A';

      doc.text(`Data Servizio: ${format(values.serviceDate, 'PPP', { locale: it })}`, 14, y);
      y += 7;
      doc.text(`Dipendente: ${employeeFullName}`, 14, y);
      y += 7;
      doc.text(`Punto Servizio: ${servicePointName}`, 14, y);
      y += 7;
      doc.text(`Tipo Servizio: ${values.serviceType}`, 14, y);
      y += 7;
      doc.text(`Orario Inizio: ${values.startTime}`, 14, y);
      y += 7;
      doc.text(`Orario Fine: ${values.endTime}`, 14, y);
      y += 7;
      doc.text(`Veicolo: ${values.vehicleMakeModel} - Targa: ${values.vehiclePlate}`, 14, y);
      y += 7;
      doc.text(`KM Iniziali: ${values.startKm} - KM Finali: ${values.endKm}`, 14, y);
      y += 7;
      doc.text(`Stato Veicolo: ${values.vehicleInitialState}`, 14, y);
      y += 7;
      doc.text(`Danni Veicolo: ${values.danniVeicolo}`, 14, y); // Updated field name
      y += 7;
      if (values.vehicleAnomalies) {
        doc.text(`Anomalie Veicolo: ${values.vehicleAnomalies}`, 14, y);
        y += 7;
      }

      y += 5;
      doc.setFontSize(12);
      doc.text("Dotazioni Controllate:", 14, y);
      y += 5;
      doc.setFontSize(10);
      doc.text(`GPS: ${values.gps === 'si' ? 'SI' : 'NO'}`, 14, y);
      y += 5;
      doc.text(`Radio Veicolare: ${values.radioVehicle === 'si' ? 'SI' : 'NO'}`, 14, y);
      y += 5;
      doc.text(`Faro Girevole: ${values.swivelingLamp === 'si' ? 'SI' : 'NO'}`, 14, y);
      y += 5;
      doc.text(`Radio Portatile: ${values.radioPortable === 'si' ? 'SI' : 'NO'}`, 14, y);
      y += 5;
      doc.text(`Estintore: ${values.extinguisher === 'si' ? 'SI' : 'NO'}`, 14, y);
      y += 5;
      doc.text(`Ruota di Scorta: ${values.spareTire === 'si' ? 'SI' : 'NO'}`, 14, y);
      y += 5;
      doc.text(`Giubbotto Alta Visibilità: ${values.highVisibilityVest === 'si' ? 'SI' : 'NO'}`, 14, y);
      y += 10;

      const pdfBlob = doc.output('blob');
      resolve(pdfBlob);
    });
  };

  const handlePrintPdf = form.handleSubmit(async (values) => {
    showInfo("Generazione PDF per la stampa...");
    const pdfBlob = await generatePdfBlob(values);
    if (pdfBlob) {
      const url = URL.createObjectURL(pdfBlob);
      window.open(url, '_blank');
      showSuccess("PDF generato con successo!");
    } else {
      showError("Impossibile generare il PDF.");
    }
  });

  const handleEmail = form.handleSubmit(async (values) => {
    if (values.vehicleInitialState !== "RICHIESTA MANUTENZIONE") {
      showError("L'email di richiesta manutenzione può essere inviata solo se lo 'Stato Veicolo' è 'RICHIESTA MANUTENZIONE'.");
      return;
    }

    const employeeName = personaleList.find(p => p.id === values.employeeId);
    const employeeFullName = employeeName ? `${employeeName.nome} ${employeeName.cognome}` : 'N/A';
    const selectedServicePoint = puntiServizioList.find(p => p.id === values.servicePointId);
    const servicePointName = selectedServicePoint?.nome_punto_servizio || 'N/A';

    const subject = `Rapporto Dotazioni di Servizio - ${employeeFullName} - ${servicePointName} - ${format(values.serviceDate, 'dd/MM/yyyy')}`;
    const textBody = "Si trasmettono in allegato i dettagli del rapporto dotazioni di servizio.\n\nCordiali saluti.";
    
    showInfo("Generazione PDF per l'allegato email...");
    const pdfBlob = await generatePdfBlob(values);

    if (pdfBlob) {
      const reader = new FileReader();
      reader.readAsDataURL(pdfBlob);
      reader.onloadend = () => {
        const base64data = reader.result?.toString().split(',')[1];
        if (base64data) {
          sendEmail(subject, textBody, false, {
            filename: `Rapporto_Dotazioni_Servizio_${format(values.serviceDate, 'yyyyMMdd')}.pdf`,
            content: base64data,
            contentType: 'application/pdf'
          });
        } else {
          showError("Errore nella conversione del PDF in Base64.");
        }
      };
      reader.onerror = () => {
        showError("Errore nella lettura del file PDF.");
      };
    } else {
      showError("Impossibile generare il PDF per l'allegato.");
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-4">
        <h3 className="text-lg font-semibold mb-4">Dettagli Rapporto</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <FormItem>
                <FormLabel>Dipendente</FormLabel>
                <Popover open={isEmployeeSelectOpen} onOpenChange={setIsEmployeeSelectOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={isEmployeeSelectOpen}
                        className="w-full justify-between"
                      >
                        {field.value
                          ? personaleList.find(
                              (personale) => personale.id === field.value
                            )?.nome + " " + personaleList.find(
                              (personale) => personale.id === field.value
                            )?.cognome
                          : "Seleziona un dipendente"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                      <CommandInput placeholder="Cerca dipendente..." />
                      <CommandEmpty>Nessun dipendente trovato.</CommandEmpty>
                      <CommandGroup>
                        {personaleList.map((personale) => (
                          <CommandItem
                            key={personale.id}
                            value={`${personale.nome} ${personale.cognome}`}
                            onSelect={() => {
                              form.setValue("employeeId", personale.id);
                              setIsEmployeeSelectOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                field.value === personale.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {personale.nome} {personale.cognome} ({personale.ruolo})
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
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="servicePointId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Punto Servizio</FormLabel>
                <Popover open={isServicePointSelectOpen} onOpenChange={setIsServicePointSelectOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={isServicePointSelectOpen}
                        className="w-full justify-between"
                      >
                        {field.value
                          ? puntiServizioList.find(
                              (point) => point.id === field.value
                            )?.nome_punto_servizio
                          : "Seleziona un punto servizio"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                      <CommandInput placeholder="Cerca punto servizio..." />
                      <CommandEmpty>Nessun punto servizio trovato.</CommandEmpty>
                      <CommandGroup>
                        {puntiServizioList.map((point) => (
                          <CommandItem
                            key={point.id}
                            value={point.nome_punto_servizio}
                            onSelect={() => {
                              form.setValue("servicePointId", point.id);
                              setIsServicePointSelectOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                field.value === point.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {point.nome_punto_servizio}
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
            name="serviceType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo Servizio</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona tipo servizio" />
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
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Orario Inizio</FormLabel>
                <div className="flex gap-2">
                  <FormControl>
                    <Input type="time" {...field} />
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
                <FormLabel>Orario Fine</FormLabel>
                <div className="flex gap-2">
                  <FormControl>
                    <Input type="time" {...field} />
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

        <h3 className="text-lg font-semibold mt-8 mb-4">Dettagli Veicolo</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startKm"
            render={({ field }) => (
              <FormItem>
                <FormLabel>KM Iniziali</FormLabel>
                <FormControl>
                  <Input type="number" step="0.1" placeholder="0.0" {...field} onChange={e => field.onChange(e.target.valueAsNumber)} />
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
                  <Input type="number" step="0.1" placeholder="0.0" {...field} onChange={e => field.onChange(e.target.valueAsNumber)} />
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
                <FormLabel>Stato Veicolo</FormLabel>
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
            name="danniVeicolo" // Updated field name
            render={({ field }) => (
              <FormItem>
                <FormLabel>Danni Veicolo</FormLabel> {/* Updated label */}
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona danni" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {vehicleDamageOptions.map((option) => ( // Updated options reference
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
              <FormLabel>Anomalie Veicolo (se presenti)</FormLabel>
              <FormControl>
                <Textarea placeholder="Descrivi eventuali anomalie..." rows={3} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <h3 className="text-lg font-semibold mt-8 mb-4">Dotazioni Controllate</h3>
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
                      <Label htmlFor="gps-si">SI</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="gps-no" />
                      <Label htmlFor="gps-no">NO</Label>
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
                      <Label htmlFor="radioVehicle-si">SI</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="radioVehicle-no" />
                      <Label htmlFor="radioVehicle-no">NO</Label>
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
                      <Label htmlFor="swivelingLamp-si">SI</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="swivelingLamp-no" />
                      <Label htmlFor="swivelingLamp-no">NO</Label>
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
                      <Label htmlFor="radioPortable-si">SI</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="radioPortable-no" />
                      <Label htmlFor="radioPortable-no">NO</Label>
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
                      <Label htmlFor="flashlight-si">SI</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="flashlight-no" />
                      <Label htmlFor="flashlight-no">NO</Label>
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
                      <Label htmlFor="extinguisher-si">SI</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="extinguisher-no" />
                      <Label htmlFor="extinguisher-no">NO</Label>
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
                      <Label htmlFor="spareTire-si">SI</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="spareTire-no" />
                      <Label htmlFor="spareTire-no">NO</Label>
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
                      <Label htmlFor="highVisibilityVest-si">SI</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="highVisibilityVest-no" />
                      <Label htmlFor="highVisibilityVest-no">NO</Label>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="pt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button 
            type="button" 
            className="bg-blue-600 hover:bg-blue-700" 
            onClick={handleEmail}
            disabled={vehicleInitialState !== "RICHIESTA MANUTENZIONE"}
          >
            EMAIL RICHIESTA MANUTENZIONE
          </Button>
          <Button type="button" className="bg-green-600 hover:bg-green-700" onClick={handlePrintPdf}>
            STAMPA PDF
          </Button>
          <Button type="submit">
            REGISTRA RAPPORTO
          </Button>
        </div>
      </form>
    </Form>
  );
}