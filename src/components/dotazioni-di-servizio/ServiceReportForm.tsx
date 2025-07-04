import React, { useState, useEffect } from "react";
import { useForm, useFieldArray, FormProvider } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, parseISO, isValid } from "date-fns";
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
import { Separator } from "@/components/ui/separator";
import { PlusCircle, Check, ChevronsUpDown } from "lucide-react";
import { showSuccess, showError, showInfo } from "@/utils/toast";
import { AutomezzoItem } from "@/components/cantiere/AutomezzoItem"; // Re-using from cantiere
import { AttrezzoItem } from "@/components/cantiere/AttrezzoItem"; // Re-using from cantiere
import { servizioOptions } from "@/lib/cantiere-data"; // Re-using from cantiere
import { Personale, PuntoServizio } from "@/lib/anagrafiche-data";
import { fetchPuntiServizio, fetchPersonale } from "@/lib/data-fetching";
import { supabase } from "@/integrations/supabase/client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";

const automezzoSchema = z.object({
  tipologia: z.string().min(1, "Tipologia richiesta."),
  marca: z.string().min(1, "Marca richiesta."),
  targa: z.string().min(1, "Targa richiesta."),
});

const attrezzoSchema = z.object({
  tipologia: z.string().min(1, "Tipologia richiesta."),
  marca: z.string().min(1, "Marca richiesta."),
  quantita: z.coerce.number().min(1, "Quantità non valida."),
});

const formSchema = z.object({
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato ora non valido (HH:MM).").optional(),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato ora non valido (HH:MM).").optional(),
  servicePointId: z.string().uuid("Seleziona un punto servizio valido.").optional().nullable(),
  serviceType: z.string().optional().nullable(),
  serviceDate: z.date().optional(), // Made optional here
  employeeId: z.string().uuid("Seleziona un addetto valido.").optional().nullable(),
  vehicleInitialState: z.string().optional().nullable(),
  danniVeicolo: z.string().optional().nullable(),
  vehicleAnomalies: z.string().optional().nullable(),
  equipmentInitialState: z.string().optional().nullable(),
  danniAttrezzatura: z.string().optional().nullable(),
  equipmentAnomalies: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  automezzi: z.array(automezzoSchema).optional(),
  attrezzi: z.array(attrezzoSchema).optional(),
  highVisibilityVest: z.enum(["si", "no"]).optional().nullable(),
  gloves: z.enum(["si", "no"]).optional().nullable(),
  safetyShoes: z.enum(["si", "no"]).optional().nullable(),
  helmet: z.enum(["si", "no"]).optional().nullable(),
  safetyGlasses: z.enum(["si", "no"]).optional().nullable(),
  earProtection: z.enum(["si", "no"]).optional().nullable(),
  otherDPI: z.string().optional().nullable(),
  isCompleted: z.boolean().default(false),
});

// Define DotazioniFormValues based on the schema
type DotazioniFormValues = z.infer<typeof formSchema>;

interface ServiceReportFormProps {
  reportId?: string;
  onCancel?: () => void;
}

export function ServiceReportForm({ reportId, onCancel }: ServiceReportFormProps) {
  const [puntiServizio, setPuntiServizio] = useState<PuntoServizio[]>([]);
  const [personaleList, setPersonaleList] = useState<Personale[]>([]);
  const [isServicePointOpen, setIsServicePointOpen] = useState(false);
  const [isEmployeeOpen, setIsEmployeeOpen] = useState(false);
  const [loadingDropdowns, setLoadingDropdowns] = useState(true);
  const [loadingInitialReport, setLoadingInitialReport] = useState(!!reportId);

  const form = useForm<DotazioniFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      startTime: format(new Date(), "HH:mm"),
      endTime: format(new Date(), "HH:mm"),
      servicePointId: null,
      serviceType: "",
      serviceDate: new Date(), // Provide a default Date object
      employeeId: null,
      vehicleInitialState: "",
      danniVeicolo: "",
      vehicleAnomalies: "",
      equipmentInitialState: "",
      danniAttrezzatura: "",
      equipmentAnomalies: "",
      notes: "",
      automezzi: [],
      attrezzi: [],
      highVisibilityVest: "no",
      gloves: "no",
      safetyShoes: "no",
      helmet: "no",
      safetyGlasses: "no",
      earProtection: "no",
      otherDPI: "",
      isCompleted: false,
    },
  });

  const { fields: automezziFields, append: appendAutomezzo, remove: removeAutomezzo } = useFieldArray({
    control: form.control,
    name: "automezzi",
  });

  const { fields: attrezziFields, append: appendAttrezzo, remove: removeAttrezzo } = useFieldArray({
    control: form.control,
    name: "attrezzi",
  });

  useEffect(() => {
    const loadDropdownData = async () => {
      setLoadingDropdowns(true);
      const fetchedPuntiServizio = await fetchPuntiServizio();
      setPuntiServizio(fetchedPuntiServizio);
      const fetchedPersonale = await fetchPersonale();
      setPersonaleList(fetchedPersonale);
      setLoadingDropdowns(false);
    };
    loadDropdownData();
  }, []);

  useEffect(() => {
    const loadReportData = async () => {
      if (reportId && !loadingDropdowns) {
        setLoadingInitialReport(true);
        const { data: report, error: reportError } = await supabase
          .from('registri_dotazioni_di_servizio')
          .select('*, automezzi_utilizzati(*), attrezzi_utilizzati(*)')
          .eq('id', reportId)
          .single();

        if (reportError) {
          showError(`Errore nel recupero del rapporto di servizio: ${reportError.message}`);
          console.error("Error fetching service report for edit:", reportError);
          setLoadingInitialReport(false);
          return;
        }

        if (report) {
          form.reset({
            startTime: report.start_time || format(new Date(), "HH:mm"),
            endTime: report.end_time || format(new Date(), "HH:mm"),
            servicePointId: report.service_point_id || null,
            serviceType: report.service_type || "",
            serviceDate: report.service_date ? parseISO(report.service_date) : new Date(), // Ensure a Date object
            employeeId: report.employee_id || null,
            vehicleInitialState: report.vehicle_initial_state || "",
            danniVeicolo: report.danni_veicolo || "",
            vehicleAnomalies: report.vehicle_anomalies || "",
            equipmentInitialState: report.equipment_initial_state || "",
            danniAttrezzatura: report.danni_attrezzatura || "",
            equipmentAnomalies: report.equipment_anomalies || "",
            notes: report.notes || "",
            automezzi: report.automezzi_utilizzati || [],
            attrezzi: report.attrezzi_utilizzati || [],
            highVisibilityVest: report.high_visibility_vest || "no",
            gloves: report.gloves || "no",
            safetyShoes: report.safety_shoes || "no",
            helmet: report.helmet || "no",
            safetyGlasses: report.safety_glasses || "no",
            earProtection: report.ear_protection || "no",
            otherDPI: report.other_dpi || "",
            isCompleted: report.status === "completed",
          });
        }
        setLoadingInitialReport(false);
      } else if (!reportId) {
        setLoadingInitialReport(false);
      }
    };

    loadReportData();
  }, [reportId, loadingDropdowns, form]);

  const onSubmit = async (values: DotazioniFormValues) => {
    const payload = {
      start_time: values.startTime,
      end_time: values.endTime,
      service_point_id: values.servicePointId,
      service_type: values.serviceType,
      service_date: values.serviceDate ? format(values.serviceDate, 'yyyy-MM-dd') : null, // Format date
      employee_id: values.employeeId,
      vehicle_initial_state: values.vehicleInitialState,
      danni_veicolo: values.danniVeicolo,
      vehicle_anomalies: values.vehicleAnomalies,
      equipment_initial_state: values.equipmentInitialState,
      danni_attrezzatura: values.danniAttrezzatura,
      equipment_anomalies: values.equipmentAnomalies,
      notes: values.notes,
      high_visibility_vest: values.highVisibilityVest,
      gloves: values.gloves,
      safety_shoes: values.safetyShoes,
      helmet: values.helmet,
      safety_glasses: values.safetyGlasses,
      ear_protection: values.earProtection,
      other_dpi: values.otherDPI,
      status: values.isCompleted ? "completed" : "active",
    };

    let recordId: string | null = null;
    let recordError: any = null;

    if (reportId) {
      const { data, error } = await supabase
        .from('registri_dotazioni_di_servizio')
        .update(payload)
        .eq('id', reportId)
        .select('id')
        .single();
      recordId = data?.id || null;
      recordError = error;
    } else {
      const { data, error } = await supabase
        .from('registri_dotazioni_di_servizio')
        .insert([payload])
        .select('id')
        .single();
      recordId = data?.id || null;
      recordError = error;
    }

    if (recordError || !recordId) {
      showError(`Errore durante la registrazione del rapporto: ${recordError?.message}`);
      console.error("Error upserting service report:", recordError);
      return;
    }

    await supabase.from('automezzi_utilizzati').delete().eq('registro_dotazioni_di_servizio_id', recordId);
    if (values.automezzi && values.automezzi.length > 0) {
      const automezziPayload = values.automezzi.map(auto => ({ ...auto, registro_dotazioni_di_servizio_id: recordId }));
      const { error: automezziInsertError } = await supabase.from('automezzi_utilizzati').insert(automezziPayload);
      if (automezziInsertError) {
        showError(`Errore durante la registrazione degli automezzi: ${automezziInsertError.message}`);
        return;
      }
    }

    await supabase.from('attrezzi_utilizzati').delete().eq('registro_dotazioni_di_servizio_id', recordId);
    if (values.attrezzi && values.attrezzi.length > 0) {
      const attrezziPayload = values.attrezzi.map(attrezzo => ({ ...attrezzo, registro_dotazioni_di_servizio_id: recordId }));
      const { error: attrezziInsertError } = await supabase.from('attrezzi_utilizzati').insert(attrezziPayload);
      if (attrezziInsertError) {
        showError(`Errore durante la registrazione degli attrezzi: ${attrezziInsertError.message}`);
        return;
      }
    }

    showSuccess(`Rapporto di servizio ${reportId ? 'modificato' : 'registrato'} con successo!`);
    form.reset();
    if (onCancel) {
      onCancel();
    }
  };

  if (loadingDropdowns || loadingInitialReport) {
    return <div className="text-center py-8">Caricamento dati...</div>;
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-4">
        <section className="p-4 border rounded-lg shadow-sm bg-card">
          <h2 className="text-xl font-semibold mb-4">Dettagli Servizio</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <FormField
              control={form.control}
              name="serviceDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data Servizio</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      value={field.value ? format(field.value, 'yyyy-MM-dd') : ''}
                      onChange={(e) => {
                        const date = parseISO(e.target.value);
                        field.onChange(isValid(date) ? date : undefined);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
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
          </div>
          <FormField
            control={form.control}
            name="servicePointId"
            render={({ field }) => (
              <FormItem className="mb-4">
                <FormLabel>Punto Servizio</FormLabel>
                <Popover open={isServicePointOpen} onOpenChange={setIsServicePointOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button variant="outline" role="combobox" className={cn("w-full justify-between", !field.value && "text-muted-foreground")}>
                        {field.value
                          ? puntiServizio.find(p => p.id === field.value)?.nome_punto_servizio
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
                        {puntiServizio.map((punto) => (
                          <CommandItem
                            value={punto.nome_punto_servizio}
                            key={punto.id}
                            onSelect={() => {
                              form.setValue("servicePointId", punto.id);
                              setIsServicePointOpen(false);
                            }}
                          >
                            <Check className={cn("mr-2 h-4 w-4", punto.id === field.value ? "opacity-100" : "opacity-0")} />
                            {punto.nome_punto_servizio}
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
            name="employeeId"
            render={({ field }) => (
              <FormItem className="mb-4">
                <FormLabel>Addetto</FormLabel>
                <Popover open={isEmployeeOpen} onOpenChange={setIsEmployeeOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button variant="outline" role="combobox" className={cn("w-full justify-between", !field.value && "text-muted-foreground")}>
                        {field.value
                          ? personaleList.find(
                              (personale) => personale.id === field.value
                            )?.nome + " " + personaleList.find(
                              (personale) => personale.id === field.value
                            )?.cognome
                          : "Seleziona un addetto"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                      <CommandInput placeholder="Cerca addetto..." />
                      <CommandEmpty>Nessun addetto trovato.</CommandEmpty>
                      <CommandGroup>
                        {personaleList.map((personale) => (
                          <CommandItem
                            value={`${personale.nome} ${personale.cognome}`}
                            key={personale.id}
                            onSelect={() => {
                              form.setValue("employeeId", personale.id);
                              setIsEmployeeOpen(false);
                            }}
                          >
                            <Check className={cn("mr-2 h-4 w-4", personale.id === field.value ? "opacity-100" : "opacity-0")} />
                            {personale.nome} {personale.cognome}
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
              <FormItem className="mb-4">
                <FormLabel>Tipo di Servizio</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona il tipo di servizio" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {servizioOptions.map((servizio) => (
                      <SelectItem key={servizio} value={servizio}>
                        {servizio}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </section>

        <section className="p-4 border rounded-lg shadow-sm bg-card">
          <h2 className="text-xl font-semibold mb-4">Stato Veicolo</h2>
          <FormField
            control={form.control}
            name="vehicleInitialState"
            render={({ field }) => (
              <FormItem className="mb-4">
                <FormLabel>Stato Iniziale Veicolo</FormLabel>
                <FormControl>
                  <Textarea placeholder="Descrivi lo stato iniziale del veicolo..." rows={3} {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="danniVeicolo"
            render={({ field }) => (
              <FormItem className="mb-4">
                <FormLabel>Danni al Veicolo</FormLabel>
                <FormControl>
                  <Textarea placeholder="Descrivi eventuali danni al veicolo..." rows={3} {...field} value={field.value || ''} />
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
                <FormLabel>Anomalie Veicolo</FormLabel>
                <FormControl>
                  <Textarea placeholder="Descrivi eventuali anomalie del veicolo..." rows={3} {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </section>

        <section className="p-4 border rounded-lg shadow-sm bg-card">
          <h2 className="text-xl font-semibold mb-4">Stato Attrezzatura</h2>
          <FormField
            control={form.control}
            name="equipmentInitialState"
            render={({ field }) => (
              <FormItem className="mb-4">
                <FormLabel>Stato Iniziale Attrezzatura</FormLabel>
                <FormControl>
                  <Textarea placeholder="Descrivi lo stato iniziale dell'attrezzatura..." rows={3} {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="danniAttrezzatura"
            render={({ field }) => (
              <FormItem className="mb-4">
                <FormLabel>Danni all'Attrezzatura</FormLabel>
                <FormControl>
                  <Textarea placeholder="Descrivi eventuali danni all'attrezzatura..." rows={3} {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="equipmentAnomalies"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Anomalie Attrezzatura</FormLabel>
                <FormControl>
                  <Textarea placeholder="Descrivi eventuali anomalie dell'attrezzatura..." rows={3} {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </section>

        <section className="p-4 border rounded-lg shadow-sm bg-card">
          <h2 className="text-xl font-semibold mb-4">DPI Utilizzati</h2>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="highVisibilityVest"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Gilet Alta Visibilità</FormLabel>
                  </div>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value || "no"}>
                      <SelectTrigger className="w-[100px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="si">Sì</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="gloves"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Guanti</FormLabel>
                  </div>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value || "no"}>
                      <SelectTrigger className="w-[100px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="si">Sì</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="safetyShoes"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Scarpe Antinfortunistiche</FormLabel>
                  </div>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value || "no"}>
                      <SelectTrigger className="w-[100px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="si">Sì</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="helmet"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Elmetto</FormLabel>
                  </div>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value || "no"}>
                      <SelectTrigger className="w-[100px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="si">Sì</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="safetyGlasses"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Occhiali Protettivi</FormLabel>
                  </div>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value || "no"}>
                      <SelectTrigger className="w-[100px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="si">Sì</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="earProtection"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Protezione Udito</FormLabel>
                  </div>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value || "no"}>
                      <SelectTrigger className="w-[100px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="si">Sì</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="otherDPI"
            render={({ field }) => (
              <FormItem className="mt-4">
                <FormLabel>Altri DPI</FormLabel>
                <FormControl>
                  <Input placeholder="Specifica altri DPI utilizzati..." {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </section>

        <section className="p-4 border rounded-lg shadow-sm bg-card">
          <h2 className="text-xl font-semibold mb-4">Automezzi Utilizzati</h2>
          <div className="space-y-4">
            {automezziFields.map((item, index) => (
              <AutomezzoItem key={item.id} index={index} onRemove={removeAutomezzo} />
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => appendAutomezzo({ tipologia: "", marca: "", targa: "" })}
            className="mt-4 w-full"
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Aggiungi Automezzo
          </Button>
        </section>

        <section className="p-4 border rounded-lg shadow-sm bg-card">
          <h2 className="text-xl font-semibold mb-4">Attrezzi Utilizzati</h2>
          <div className="space-y-4">
            {attrezziFields.map((item, index) => (
              <AttrezzoItem key={item.id} index={index} onRemove={removeAttrezzo} />
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => appendAttrezzo({ tipologia: "", marca: "", quantita: 1 })}
            className="mt-4 w-full"
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Aggiungi Attrezzo
          </Button>
        </section>

        <section className="p-4 border rounded-lg shadow-sm bg-card">
          <h2 className="text-xl font-semibold mb-4">Note Aggiuntive</h2>
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Note</FormLabel>
                <FormControl>
                  <Textarea placeholder="Inserisci qui eventuali note..." rows={3} {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
            {reportId ? "SALVA MODIFICHE" : "REGISTRA RAPPORTO"}
          </Button>
          {onCancel && (
            <Button type="button" variant="outline" className="w-full" onClick={onCancel}>
              ANNULLA
            </Button>
          )}
        </div>
      </form>
    </FormProvider>
  );
}