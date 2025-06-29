import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { it } from 'date-fns/locale';
import { CalendarIcon } from "lucide-react";
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
  serviceLocationOptions,
  serviceTypeOptions,
  vehicleMakeModelOptions,
  vehiclePlateOptions,
  vehicleInitialStateOptions,
  bodyworkDamageOptions,
} from "@/lib/dotazioni-data";
import { Personale } from "@/lib/anagrafiche-data";
import { fetchPersonale } from "@/lib/data-fetching"; // Corretto il percorso di importazione

const formSchema = z.object({
  serviceDate: z.date({
    required_error: "La data del servizio è richiesta.",
  }),
  employeeId: z.string().uuid("Seleziona un dipendente valido.").nonempty("Il dipendente è richiesto."),
  serviceLocation: z.string().min(1, "La località del servizio è richiesta."),
  serviceType: z.string().min(1, "Il tipo di servizio è richiesto."),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato ora inizio non valido (HH:MM)."),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato ora fine non valido (HH:MM)."),
  vehicleMakeModel: z.string().min(1, "Marca/Modello veicolo è richiesto."),
  vehiclePlate: z.string().min(1, "Targa veicolo è richiesta."),
  startKm: z.coerce.number().min(0, "KM iniziali non validi."),
  endKm: z.coerce.number().min(0, "KM finali non validi."),
  vehicleInitialState: z.string().min(1, "Stato iniziale veicolo è richiesto."),
  bodyworkDamage: z.string().min(1, "Danni carrozzeria è richiesto."),
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

export default function ServiceReportForm() {
  const [personaleList, setPersonaleList] = useState<Personale[]>([]);

  useEffect(() => {
    const loadPersonale = async () => {
      const fetchedPersonale = await fetchPersonale();
      setPersonaleList(fetchedPersonale);
    };
    loadPersonale();
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
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    console.log("Dati Rapporto di Servizio:", values);

    const payload = {
      service_date: format(values.serviceDate, 'yyyy-MM-dd'),
      employee_id: values.employeeId,
      service_location: values.serviceLocation,
      service_type: values.serviceType,
      start_time: values.startTime,
      end_time: values.endTime,
      vehicle_make_model: values.vehicleMakeModel,
      vehicle_plate: values.vehiclePlate,
      start_km: values.startKm,
      end_km: values.endKm,
      vehicle_initial_state: values.vehicleInitialState,
      bodywork_damage: values.bodyworkDamage,
      vehicle_anomalies: values.vehicleAnomalies || null,
      gps: values.gps,
      radio_vehicle: values.radioVehicle,
      swiveling_lamp: values.swivelingLamp,
      radio_portable: values.radioPortable,
      flashlight: values.flashlight,
      extinguisher: values.extinguisher,
      spare_tire: values.spareTire,
      high_visibility_vest: values.highVisibilityVest,
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
      form.reset(); // Reset form after successful submission
    }
  };

  const handleSetCurrentTime = (field: "startTime" | "endTime") => {
    form.setValue(field, format(new Date(), "HH:mm"));
  };

  const handleGpsTracking = () => {
    // This form does not have latitude/longitude fields in its schema,
    // but if it did, the logic would be similar to CantiereForm.
    // For now, it's just a placeholder for potential future use or a different report type.
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

      doc.text(`Data Servizio: ${format(values.serviceDate, 'PPP', { locale: it })}`, 14, y);
      y += 7;
      doc.text(`Dipendente: ${employeeFullName}`, 14, y);
      y += 7;
      doc.text(`Località Servizio: ${values.serviceLocation}`, 14, y);
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
      doc.text(`Stato Iniziale Veicolo: ${values.vehicleInitialState}`, 14, y);
      y += 7;
      doc.text(`Danni Carrozzeria: ${values.bodyworkDamage}`, 14, y);
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
      doc.text(`GPS: ${values.gps ? 'SI' : 'NO'}`, 14, y);
      y += 5;
      doc.text(`Radio Veicolare: ${values.radioVehicle ? 'SI' : 'NO'}`, 14, y);
      y += 5;
      doc.text(`Faro Girevole: ${values.swivelingLamp ? 'SI' : 'NO'}`, 14, y);
      y += 5;
      doc.text(`Radio Portatile: ${values.radioPortable ? 'SI' : 'NO'}`, 14, y);
      y += 5;
      doc.text(`Estintore: ${values.extinguisher ? 'SI' : 'NO'}`, 14, y);
      y += 5;
      doc.text(`Ruota di Scorta: ${values.spareTire ? 'SI' : 'NO'}`, 14, y);
      y += 5;
      doc.text(`Giubbotto Alta Visibilità: ${values.highVisibilityVest ? 'SI' : 'NO'}`, 14, y);
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
    const employeeName = personaleList.find(p => p.id === values.employeeId);
    const employeeFullName = employeeName ? `${employeeName.nome} ${employeeName.cognome}` : 'N/A';
    const subject = `Rapporto Dotazioni di Servizio - ${employeeFullName} - ${format(values.serviceDate, 'dd/MM/yyyy')}`;
    const textBody = "Si trasmettono in allegato i dettagli del rapporto dotazioni di servizio.\n\nCordiali saluti.";
    
    showInfo("Generazione PDF per l'allegato email...");
    const pdfBlob = await generatePdfBlob(values);

    if (pdfBlob) {
      const reader = new FileReader();
      reader.readAsDataURL(pdfBlob);
      reader.onloadend = () => {
        const base64data = reader.result?.toString().split(',')[1]; // Get base64 part
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
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona un dipendente" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {personaleList.map((personale) => (
                      <SelectItem key={personale.id} value={personale.id}>
                        {personale.nome} {personale.cognome} ({personale.ruolo})
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
            name="serviceLocation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Località Servizio</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona località" />
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
              <FormItem>
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

        <div className="pt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button type="button" className="bg-blue-600 hover:bg-blue-700" onClick={handleEmail}>
            INVIA EMAIL
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