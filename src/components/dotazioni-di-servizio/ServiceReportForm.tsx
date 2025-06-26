import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox"; // Import Checkbox
import {
  serviceLocationOptions,
  serviceTypeOptions,
  vehicleMakeModelOptions,
  vehiclePlateOptions,
  vehicleInitialStateOptions,
  bodyworkDamageOptions,
  employeeNameOptions,
} from "@/lib/dotazioni-data";
import { sendEmail } from "@/utils/email"; // Import the sendEmail utility
import { RECIPIENT_EMAIL } from "@/lib/config"; // Import RECIPIENT_EMAIL
import { showSuccess, showError, showInfo } from "@/utils/toast"; // Import toast utilities
import jsPDF from 'jspdf'; // Import jsPDF
import 'jspdf-autotable'; // Import jspdf-autotable
import { format } from "date-fns"; // Import format for date formatting

// Definizione dello schema
const formSchema = z.object({
  serviceDate: z.string().min(1, "La data è obbligatoria"),
  employeeId: z.string().min(1, "L'addetto è obbligatorio"),
  serviceLocation: z.string().min(1, "La località è obbligatoria"),
  serviceType: z.string().min(1, "Il tipo di servizio è obbligatorio"),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato ora inizio non valido (HH:MM)."),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato ora fine non valido (HH:MM)."),
  startKm: z.coerce.number().min(0, "I km iniziali sono obbligatori e non negativi."),
  endKm: z.coerce.number().min(0, "I km finali sono obbligatori e non negativi."),
  vehicleMakeModel: z.string().min(1, "Il modello è obbligatorio"),
  vehiclePlate: z.string().min(1, "La targa è obbligatoria"),
  vehicleInitialState: z.string().min(1, "Lo stato iniziale è obbligatorio"),
  bodyworkDamage: z.string().optional(),
  vehicleAnomalies: z.string().optional(),
  gpsSi: z.boolean().default(false),
  gpsNo: z.boolean().default(false),
  radioVehicleSi: z.boolean().default(false),
  radioVehicleNo: z.boolean().default(false),
  swivelingLampSi: z.boolean().default(false),
  swivelingLampNo: z.boolean().default(false),
  radioPortableSi: z.boolean().default(false),
  radioPortableNo: z.boolean().default(false),
  flashlightSi: z.boolean().default(false),
  flashlightNo: z.boolean().default(false),
  extinguisherSi: z.boolean().default(false),
  extinguisherNo: z.boolean().default(false),
  spareTireSi: z.boolean().default(false),
  spareTireNo: z.boolean().default(false),
  highVisibilityVestSi: z.boolean().default(false),
  highVisibilityVestNo: z.boolean().default(false),
}).refine(data => data.endKm >= data.startKm, {
  message: "I km finali non possono essere inferiori ai km iniziali.",
  path: ["endKm"],
}).refine(data => data.gpsSi !== data.gpsNo, {
  message: "Selezionare SI o NO per GPS.",
  path: ["gpsSi"],
}).refine(data => data.radioVehicleSi !== data.radioVehicleNo, {
  message: "Selezionare SI o NO per Radio Veicolare.",
  path: ["radioVehicleSi"],
}).refine(data => data.swivelingLampSi !== data.swivelingLampNo, {
  message: "Selezionare SI o NO per Lampada Girevole.",
  path: ["swivelingLampSi"],
}).refine(data => data.radioPortableSi !== data.radioPortableNo, {
  message: "Selezionare SI o NO per Radio Portatile.",
  path: ["radioPortableSi"],
}).refine(data => data.flashlightSi !== data.flashlightNo, {
  message: "Selezionare SI o NO per Torcia.",
  path: ["flashlightSi"],
}).refine(data => data.extinguisherSi !== data.extinguisherNo, {
  message: "Selezionare SI o NO per Estintore.",
  path: ["extinguisherSi"],
}).refine(data => data.spareTireSi !== data.spareTireNo, {
  message: "Selezionare SI o NO per Ruota di Scorta.",
  path: ["spareTireSi"],
}).refine(data => data.highVisibilityVestSi !== data.highVisibilityVestNo, {
  message: "Selezionare SI o NO per Giubbotto Alta Visibilità.",
  path: ["highVisibilityVestSi"],
});

// Definizione del componente
export const ServiceReportForm = () => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      serviceDate: "",
      employeeId: "",
      serviceLocation: "",
      serviceType: "",
      startTime: "",
      endTime: "",
      startKm: 0,
      endKm: 0,
      vehicleMakeModel: "",
      vehiclePlate: "",
      vehicleInitialState: "",
      bodyworkDamage: "",
      vehicleAnomalies: "",
      gpsSi: false,
      gpsNo: false,
      radioVehicleSi: false,
      radioVehicleNo: false,
      swivelingLampSi: false,
      swivelingLampNo: false,
      radioPortableSi: false,
      radioPortableNo: false,
      flashlightSi: false,
      flashlightNo: false,
      extinguisherSi: false,
      extinguisherNo: false,
      spareTireSi: false,
      spareTireNo: false,
      highVisibilityVestSi: false,
      highVisibilityVestNo: false,
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    console.log(values);
    showSuccess("Rapporto di servizio inviato con successo!");
    // Qui potresti inviare i dati a un backend
    form.reset(); // Reset form after submission
  };

  // Helper per i campi SI/NO con checkbox separate
  const renderBooleanCheckboxes = (
    label: string,
    siFieldName: keyof z.infer<typeof formSchema>,
    noFieldName: keyof z.infer<typeof formSchema>
  ) => (
    <div className="space-y-2">
      <FormLabel>{label}</FormLabel>
      <div className="flex space-x-4">
        <FormField
          control={form.control}
          name={siFieldName}
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(checked) => {
                    field.onChange(checked);
                    if (checked) {
                      form.setValue(noFieldName, false);
                    }
                  }}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>SI</FormLabel>
              </div>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={noFieldName}
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(checked) => {
                    field.onChange(checked);
                    if (checked) {
                      form.setValue(siFieldName, false);
                    }
                  }}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>NO</FormLabel>
              </div>
            </FormItem>
          )}
        />
      </div>
      {(form.formState.errors as any)[siFieldName] && (
        <FormMessage>{(form.formState.errors as any)[siFieldName]?.message}</FormMessage>
      )}
    </div>
  );

  const handleEmail = () => {
    const values = form.getValues();
    const subject = `Rapporto Dotazioni di Servizio - ${values.employeeId} - ${values.serviceLocation} - ${format(new Date(values.serviceDate), 'dd/MM/yyyy')}`;
    
    let body = `Dettagli Rapporto Dotazioni di Servizio:\n\n`;
    body += `Data Servizio: ${format(new Date(values.serviceDate), 'dd/MM/yyyy')}\n`;
    body += `Addetto: ${values.employeeId}\n`;
    body += `Località Servizio: ${values.serviceLocation}\n`;
    body += `Tipo Servizio: ${values.serviceType}\n`;
    body += `Ora Inizio: ${values.startTime}\n`;
    body += `Ora Fine: ${values.endTime}\n`;
    body += `Km Iniziali: ${values.startKm}\n`;
    body += `Km Finali: ${values.endKm}\n`;
    body += `\nDettagli Veicolo:\n`;
    body += `Marca e Modello: ${values.vehicleMakeModel}\n`;
    body += `Targa: ${values.vehiclePlate}\n`;
    body += `Stato Iniziale: ${values.vehicleInitialState}\n`;
    body += `Danni Carrozzeria: ${values.bodyworkDamage || 'Nessuno'}\n`;
    if (values.vehicleAnomalies) {
      body += `Anomalie Veicolo: ${values.vehicleAnomalies}\n`;
    }

    body += `\nControllo Accessori:\n`;
    body += `GPS: ${values.gpsSi ? 'SI' : 'NO'}\n`;
    body += `Radio Veicolare: ${values.radioVehicleSi ? 'SI' : 'NO'}\n`;
    body += `Lampada Girevole: ${values.swivelingLampSi ? 'SI' : 'NO'}\n`;
    body += `Radio Portatile: ${values.radioPortableSi ? 'SI' : 'NO'}\n`;
    body += `Torcia: ${values.flashlightSi ? 'SI' : 'NO'}\n`;
    body += `Estintore: ${values.extinguisherSi ? 'SI' : 'NO'}\n`;
    body += `Ruota di Scorta: ${values.spareTireSi ? 'SI' : 'NO'}\n`;
    body += `Giubbotto Alta Visibilità: ${values.highVisibilityVestSi ? 'SI' : 'NO'}\n`;

    sendEmail(subject, body);
  };

  const handlePrintPdf = () => {
    showInfo("Generazione PDF per il rapporto dotazioni di servizio...");
    const values = form.getValues();

    const doc = new jsPDF();
    let y = 20;

    doc.setFontSize(18);
    doc.text("Rapporto Dotazioni di Servizio", 14, y);
    y += 10;

    doc.setFontSize(10);
    doc.text(`Data Servizio: ${format(new Date(values.serviceDate), 'dd/MM/yyyy')}`, 14, y);
    y += 7;
    doc.text(`Addetto: ${values.employeeId}`, 14, y);
    y += 7;
    doc.text(`Località Servizio: ${values.serviceLocation}`, 14, y);
    y += 7;
    doc.text(`Tipo Servizio: ${values.serviceType}`, 14, y);
    y += 7;
    doc.text(`Ora Inizio: ${values.startTime}`, 14, y);
    y += 7;
    doc.text(`Ora Fine: ${values.endTime}`, 14, y);
    y += 7;
    doc.text(`Km Iniziali: ${values.startKm}`, 14, y);
    y += 7;
    doc.text(`Km Finali: ${values.endKm}`, 14, y);
    y += 10;

    doc.setFontSize(12);
    doc.text("Dettagli Veicolo:", 14, y);
    y += 5;
    doc.setFontSize(10);
    doc.text(`Marca e Modello: ${values.vehicleMakeModel}`, 14, y);
    y += 7;
    doc.text(`Targa: ${values.vehiclePlate}`, 14, y);
    y += 7;
    doc.text(`Stato Iniziale: ${values.vehicleInitialState}`, 14, y);
    y += 7;
    doc.text(`Danni Carrozzeria: ${values.bodyworkDamage || 'Nessuno'}`, 14, y);
    y += 7;
    if (values.vehicleAnomalies) {
      const splitAnomalies = doc.splitTextToSize(`Anomalie Veicolo: ${values.vehicleAnomalies}`, 180);
      doc.text(splitAnomalies, 14, y);
      y += (splitAnomalies.length * 5);
    }
    y += 10;

    doc.setFontSize(12);
    doc.text("Controllo Accessori:", 14, y);
    y += 5;
    doc.setFontSize(10);
    doc.text(`GPS: ${values.gpsSi ? 'SI' : 'NO'}`, 14, y);
    y += 7;
    doc.text(`Radio Veicolare: ${values.radioVehicleSi ? 'SI' : 'NO'}`, 14, y);
    y += 7;
    doc.text(`Lampada Girevole: ${values.swivelingLampSi ? 'SI' : 'NO'}`, 14, y);
    y += 7;
    doc.text(`Radio Portatile: ${values.radioPortableSi ? 'SI' : 'NO'}`, 14, y);
    y += 7;
    doc.text(`Torcia: ${values.flashlightSi ? 'SI' : 'NO'}`, 14, y);
    y += 7;
    doc.text(`Estintore: ${values.extinguisherSi ? 'SI' : 'NO'}`, 14, y);
    y += 7;
    doc.text(`Ruota di Scorta: ${values.spareTireSi ? 'SI' : 'NO'}`, 14, y);
    y += 7;
    doc.text(`Giubbotto Alta Visibilità: ${values.highVisibilityVestSi ? 'SI' : 'NO'}`, 14, y);
    y += 10;

    doc.output('dataurlnewwindow'); // Open in new tab
    showSuccess("PDF del rapporto dotazioni di servizio generato con successo!");
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="serviceDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data Servizio</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="employeeId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Addetto</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona addetto" />
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
          <FormField
            control={form.control}
            name="startKm"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Km Iniziali</FormLabel>
                <FormControl>
                  <Input type="number" {...field} onChange={e => field.onChange(e.target.valueAsNumber)} />
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
                <FormLabel>Km Finali</FormLabel>
                <FormControl>
                  <Input type="number" {...field} onChange={e => field.onChange(e.target.valueAsNumber)} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <h3 className="text-lg font-semibold mt-6 mb-4">Dettagli Veicolo</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="vehicleMakeModel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Marca e Modello Veicolo</FormLabel>
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
              <FormItem className="md:col-span-2">
                <FormLabel>Anomalie Veicolo (se "ALTRO" nei danni carrozzeria)</FormLabel>
                <FormControl>
                  <Textarea placeholder="Descrivi eventuali anomalie..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <h3 className="text-lg font-semibold mt-6 mb-4">Controllo Accessori</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderBooleanCheckboxes("GPS", "gpsSi", "gpsNo")}
          {renderBooleanCheckboxes("Radio Veicolare", "radioVehicleSi", "radioVehicleNo")}
          {renderBooleanCheckboxes("Lampada Girevole", "swivelingLampSi", "swivelingLampNo")}
          {renderBooleanCheckboxes("Radio Portatile", "radioPortableSi", "radioPortableNo")}
          {renderBooleanCheckboxes("Torcia", "flashlightSi", "flashlightNo")}
          {renderBooleanCheckboxes("Estintore", "extinguisherSi", "extinguisherNo")}
          {renderBooleanCheckboxes("Ruota di Scorta", "spareTireSi", "spareTireNo")}
          {renderBooleanCheckboxes("Giubbotto Alta Visibilità", "highVisibilityVestSi", "highVisibilityVestNo")}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <Button type="button" className="w-full bg-blue-600 hover:bg-blue-700" onClick={handleEmail}>
            INVIA EMAIL
          </Button>
          <Button type="button" className="w-full bg-green-600 hover:bg-green-700" onClick={handlePrintPdf}>
            STAMPA PDF
          </Button>
          <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700">
            INVIA RAPPORTO
          </Button>
        </div>
      </form>
    </Form>
  );
};