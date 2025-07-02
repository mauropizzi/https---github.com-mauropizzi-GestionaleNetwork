import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { it } from 'date-fns/locale';
import { CalendarIcon } from "lucide-react";

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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { showSuccess, showError } from "@/utils/toast";
import { Cliente, PuntoServizio, Fornitore, serviceTypeRateOptions } from "@/lib/anagrafiche-data";
import { fetchClienti, fetchPuntiServizio, fetchFornitori, invalidateTariffeCache } from "@/lib/data-fetching"; // Import invalidateTariffeCache
import { supabase } from "@/integrations/supabase/client"; // Import Supabase client

const unitaMisuraOptions = ["ora", "intervento", "km", "mese"];

const formSchema = z.object({
  cliente_id: z.string().uuid("Seleziona un cliente valido.").nonempty("Il cliente è richiesto."),
  tipo_servizio: z.string().min(1, "Il tipo di servizio è richiesto."),
  importo: z.coerce.number().min(0.01, "L'importo deve essere un numero positivo."),
  supplier_rate: z.coerce.number().min(0.01, "La tariffa fornitore deve essere un numero positivo."),
  unita_misura: z.string().min(1, "L'unità di misura è richiesta."),
  punto_servizio_id: z.string().uuid("Seleziona un punto servizio valido.").optional().or(z.literal("")),
  fornitore_id: z.string().uuid("Seleziona un fornitore valido.").optional().or(z.literal("")), // Nuovo campo
  data_inizio_validita: z.date().optional().nullable(),
  data_fine_validita: z.date().optional().nullable(),
  note: z.string().optional().nullable(),
}); // Removed .refine from here

interface TariffeFormProps {
  prefillData?: {
    cliente_id?: string;
    tipo_servizio?: string;
    punto_servizio_id?: string;
    fornitore_id?: string;
    data_inizio_validita?: Date | null;
    data_fine_validita?: Date | null;
  } | null;
}

export function TariffeForm({ prefillData }: TariffeFormProps) {
  const [clienti, setClienti] = useState<Cliente[]>([]);
  const [puntiServizio, setPuntiServizio] = useState<PuntoServizio[]>([]);
  const [fornitori, setFornitori] = useState<Fornitore[]>([]); // Nuovo stato per i fornitori
  const [hasAppliedPrefill, setHasAppliedPrefill] = useState(false); // Nuovo stato per tracciare la precompilazione

  // Load dropdown data once on component mount
  useEffect(() => {
    const loadData = async () => {
      const fetchedClienti = await fetchClienti();
      const fetchedPuntiServizio = await fetchPuntiServizio();
      const fetchedFornitori = await fetchFornitori();
      setClienti(fetchedClienti);
      setPuntiServizio(fetchedPuntiServizio);
      setFornitori(fetchedFornitori);
    };
    loadData();
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cliente_id: "",
      tipo_servizio: "",
      importo: 0,
      supplier_rate: 0,
      unita_misura: "",
      punto_servizio_id: "",
      fornitore_id: "", // Default per il nuovo campo
      data_inizio_validita: null,
      data_fine_validita: null,
      note: null,
    },
  });

  // Effect to reset hasAppliedPrefill when prefillData changes (e.g., new missing tariff clicked)
  useEffect(() => {
    setHasAppliedPrefill(false);
  }, [prefillData]);

  // Apply prefill data when available and dropdown data is loaded
  useEffect(() => {
    console.log("TariffeForm - prefillData effect. prefillData:", prefillData);
    console.log("TariffeForm - Dropdown data loaded status: clienti.length", clienti.length, "ps.length", puntiServizio.length, "fornitori.length", fornitori.length);
    console.log("TariffeForm - hasAppliedPrefill:", hasAppliedPrefill);

    // Only attempt to reset if prefillData exists AND dropdowns are populated AND prefill hasn't been applied yet
    if (prefillData && !hasAppliedPrefill && clienti.length > 0 && puntiServizio.length > 0 && fornitori.length > 0) {
      const resetValues = {
        cliente_id: prefillData.cliente_id || "",
        tipo_servizio: prefillData.tipo_servizio || "",
        punto_servizio_id: prefillData.punto_servizio_id || "",
        fornitore_id: prefillData.fornitore_id || "",
        data_inizio_validita: prefillData.data_inizio_validita,
        data_fine_validita: prefillData.data_fine_validita,
        importo: 0, // Keep default for new tariff
        supplier_rate: 0, // Keep default for new tariff
        unita_misura: "", // Will be set by another useEffect based on tipo_servizio
        note: null,
      };
      console.log("TariffeForm - Attempting form.reset with:", resetValues);
      form.reset(resetValues);

      let defaultUnitaMisura = "";
      switch (prefillData.tipo_servizio) {
        case "Piantonamento":
        case "Servizi Fiduciari":
          defaultUnitaMisura = "ora";
          break;
        case "Ispezioni":
        case "Bonifiche":
        case "Gestione Chiavi":
        case "Apertura/Chiusura":
        case "Intervento":
          defaultUnitaMisura = "intervento";
          break;
        case "Disponibilità Pronto Intervento":
        case "Videosorveglianza":
        case "Impianto Allarme":
        case "Bidirezionale":
        case "Monodirezionale":
        case "Tenuta Chiavi":
          defaultUnitaMisura = "mese";
          break;
      }
      if (defaultUnitaMisura) {
        console.log("TariffeForm - Setting default unita_misura:", defaultUnitaMisura);
        form.setValue("unita_misura", defaultUnitaMisura, { shouldValidate: true });
      }
      setHasAppliedPrefill(true); // Mark prefill as applied
    } else if (prefillData && !hasAppliedPrefill) {
      console.log("TariffeForm - Prefill data present, but waiting for dropdowns to load or already applied.");
    }
  }, [prefillData, clienti, puntiServizio, fornitori, form, hasAppliedPrefill]);


  // Watch for changes in tipo_servizio to auto-set unita_misura
  const tipoServizio = form.watch("tipo_servizio");

  useEffect(() => {
    let defaultUnitaMisura = "";
    switch (tipoServizio) {
      case "Piantonamento":
      case "Servizi Fiduciari":
        defaultUnitaMisura = "ora";
        break;
      case "Ispezioni":
      case "Bonifiche":
      case "Gestione Chiavi":
      case "Apertura/Chiusura":
      case "Intervento":
        defaultUnitaMisura = "intervento";
        break;
      case "Disponibilità Pronto Intervento":
      case "Videosorveglianza":
      case "Impianto Allarme":
      case "Bidirezionale":
      case "Monodirezionale":
      case "Tenuta Chiavi":
        defaultUnitaMisura = "mese";
        break;
    }
    if (defaultUnitaMisura) {
      form.setValue("unita_misura", defaultUnitaMisura, { shouldValidate: true });
    }
  }, [tipoServizio, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    // Manual date validation
    if (values.data_inizio_validita && values.data_fine_validita && values.data_fine_validita < values.data_inizio_validita) {
      form.setError("data_fine_validita", {
        type: "manual",
        message: "La data di fine validità non può essere precedente alla data di inizio.",
      });
      showError("La data di fine validità non può essere precedente alla data di inizio.");
      return;
    }

    console.log("Dati Tariffa:", values);

    const payload = {
      client_id: values.cliente_id,
      service_type: values.tipo_servizio,
      client_rate: values.importo,
      supplier_rate: values.supplier_rate,
      unita_misura: values.unita_misura,
      punto_servizio_id: values.punto_servizio_id || null,
      fornitore_id: values.fornitore_id || null,
      data_inizio_validita: values.data_inizio_validita ? format(values.data_inizio_validita, 'yyyy-MM-dd') : null,
      data_fine_validita: values.data_fine_validita ? format(values.data_fine_validita, 'yyyy-MM-dd') : null,
      note: values.note || null,
    };

    const { data, error } = await supabase
      .from('tariffe')
      .insert([payload])
      .select();

    if (error) {
      showError(`Errore durante la registrazione della tariffa: ${error.message}`);
      console.error("Error inserting tariffa:", error);
    } else {
      showSuccess("Tariffa salvata con successo!");
      console.log("Dati Tariffa salvati:", data);
      form.reset({
        cliente_id: "",
        tipo_servizio: "",
        importo: 0,
        supplier_rate: 0,
        unita_misura: "",
        punto_servizio_id: "",
        fornitore_id: "",
        data_inizio_validita: null,
        data_fine_validita: null,
        note: null,
      });
      setHasAppliedPrefill(false); // Reset prefill flag after successful submission

      // Invalidate the cache for tariffs to force a re-fetch next time
      invalidateTariffeCache();
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <h3 className="text-lg font-semibold">Dettagli Tariffa</h3>
        <FormField
          control={form.control}
          name="cliente_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cliente</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(value === "DYAD_EMPTY_VALUE" ? "" : value)}
                value={field.value || "DYAD_EMPTY_VALUE"}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona un cliente" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="DYAD_EMPTY_VALUE">Seleziona un cliente</SelectItem>
                  {clienti.map((cliente) => (
                    <SelectItem key={cliente.id} value={cliente.id}>
                      {cliente.nome_cliente}
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
          name="tipo_servizio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo di Servizio</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona tipo di servizio" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {serviceTypeRateOptions.map((option) => (
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="importo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Importo Cliente (€)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="0.00" {...field} onChange={e => field.onChange(e.target.valueAsNumber)} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="supplier_rate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Importo Fornitore (€)</FormLabel> {/* Corrected closing tag */}
                <FormControl>
                  <Input type="number" step="0.01" placeholder="0.00" {...field} onChange={e => field.onChange(e.target.valueAsNumber)} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="unita_misura"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Unità di Misura</FormLabel>
              <Select onValueChange={field.onChange} value={field.value} disabled={!!tipoServizio && (tipoServizio === "Piantonamento" || tipoServizio === "Servizi Fiduciari" || tipoServizio === "Ispezioni" || tipoServizio === "Bonifiche" || tipoServizio === "Gestione Chiavi" || tipoServizio === "Apertura/Chiusura" || tipoServizio === "Intervento" || tipoServizio === "Disponibilità Pronto Intervento" || tipoServizio === "Videosorveglianza" || tipoServizio === "Impianto Allarme" || tipoServizio === "Bidirezionale" || tipoServizio === "Monodirezionale" || tipoServizio === "Tenuta Chiavi")}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona unità di misura" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {unitaMisuraOptions.map((option) => (
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
          name="punto_servizio_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Punto Servizio Associato (Opzionale)</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(value === "DYAD_EMPTY_VALUE" ? "" : value)}
                value={field.value || "DYAD_EMPTY_VALUE"}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona un punto servizio" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="DYAD_EMPTY_VALUE">Nessun Punto Servizio Specifico</SelectItem>
                  {puntiServizio.map((punto) => (
                    <SelectItem key={punto.id} value={punto.id}>
                      {punto.nome_punto_servizio}
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
          name="fornitore_id" // Nuovo campo Fornitore
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fornitore Associato (Opzionale)</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(value === "DYAD_EMPTY_VALUE" ? "" : value)}
                value={field.value || "DYAD_EMPTY_VALUE"}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona un fornitore" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="DYAD_EMPTY_VALUE">Nessun Fornitore Specifico</SelectItem>
                  {fornitori.map((fornitore) => (
                    <SelectItem key={fornitore.id} value={fornitore.id}>
                      {fornitore.nome_fornitore}
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
            name="data_inizio_validita"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data Inizio Validità</FormLabel>
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
                      selected={field.value || undefined}
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
            name="data_fine_validita"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data Fine Validità</FormLabel>
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
                      selected={field.value || undefined}
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
        </div>
        <FormField
          control={form.control}
          name="note"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Note Aggiuntive</FormLabel>
              <FormControl>
                <Textarea placeholder="Note sulla tariffa..." {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">Salva Tariffa</Button>
      </form>
    </Form>
  );
}