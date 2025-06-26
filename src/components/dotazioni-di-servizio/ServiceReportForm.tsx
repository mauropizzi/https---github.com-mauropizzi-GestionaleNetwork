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
        
        <Button type="submit" className="w-full">
          Invia Rapporto
        </Button>
      </form>
    </Form>
  );
};