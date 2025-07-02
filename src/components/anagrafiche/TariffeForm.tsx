import React, { useState, useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { showSuccess, showError } from "@/utils/toast";
import { useAnagraficheData } from "@/hooks/use-anagrafiche-data";
import { invalidateTariffeCache } from "@/lib/data-fetching";
import { supabase } from "@/integrations/supabase/client";

// Import modular components
import { TariffCoreDetails } from './tariffe/TariffCoreDetails';
import { TariffRateFields } from './tariffe/TariffRateFields';
import { TariffAssociationFields } from './tariffe/TariffAssociationFields';
import { TariffValidityFields } from './tariffe/TariffValidityFields';
import { TariffNotesField } from './tariffe/TariffNotesField';

const formSchema = z.object({
  cliente_id: z.string().uuid("Seleziona un cliente valido.").nonempty("Il cliente è richiesto."),
  tipo_servizio: z.string().min(1, "Il tipo di servizio è richiesto."),
  client_rate: z.coerce.number().min(0.01, "L'importo deve essere un numero positivo."),
  supplier_rate: z.coerce.number().min(0.01, "La tariffa fornitore deve essere un numero positivo."),
  unita_misura: z.string().min(1, "L'unità di misura è richiesta."),
  punto_servizio_id: z.string().uuid("Seleziona un punto servizio valido.").optional().or(z.literal("")),
  fornitore_id: z.string().uuid("Seleziona un fornitore valido.").optional().or(z.literal("")),
  data_inizio_validita: z.date().optional().nullable(),
  data_fine_validita: z.date().optional().nullable(),
  note: z.string().optional().nullable(),
}).refine(data => {
    if (data.data_inizio_validita && data.data_fine_validita) {
        return data.data_fine_validita >= data.data_inizio_validita;
    }
    return true;
}, {
    message: "La data di fine validità non può essere precedente alla data di inizio.",
    path: ["data_fine_validita"],
});

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
  const { clienti, puntiServizio, fornitori, loading } = useAnagraficheData();
  const [hasAppliedPrefill, setHasAppliedPrefill] = useState(false);

  const methods = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cliente_id: "",
      tipo_servizio: "",
      client_rate: 0,
      supplier_rate: 0,
      unita_misura: "",
      punto_servizio_id: "",
      fornitore_id: "",
      data_inizio_validita: null,
      data_fine_validita: null,
      note: null,
    },
  });

  useEffect(() => {
    setHasAppliedPrefill(false);
  }, [prefillData]);

  useEffect(() => {
    if (prefillData && !hasAppliedPrefill && !loading) {
      methods.reset({
        cliente_id: prefillData.cliente_id || "",
        tipo_servizio: prefillData.tipo_servizio || "",
        punto_servizio_id: prefillData.punto_servizio_id || "",
        fornitore_id: prefillData.fornitore_id || "",
        data_inizio_validita: prefillData.data_inizio_validita,
        data_fine_validita: prefillData.data_fine_validita,
        client_rate: 0,
        supplier_rate: 0,
        unita_misura: "",
        note: null,
      });
      setHasAppliedPrefill(true);
    }
  }, [prefillData, loading, hasAppliedPrefill, methods]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const payload = {
      client_id: values.cliente_id,
      service_type: values.tipo_servizio,
      client_rate: values.client_rate,
      supplier_rate: values.supplier_rate,
      unita_misura: values.unita_misura,
      punto_servizio_id: values.punto_servizio_id || null,
      fornitore_id: values.fornitore_id || null,
      data_inizio_validita: values.data_inizio_validita ? format(values.data_inizio_validita, 'yyyy-MM-dd') : null,
      data_fine_validita: values.data_fine_validita ? format(values.data_fine_validita, 'yyyy-MM-dd') : null,
      note: values.note || null,
    };

    const { data, error } = await supabase.from('tariffe').insert([payload]).select();

    if (error) {
      showError(`Errore durante la registrazione della tariffa: ${error.message}`);
      console.error("Error inserting tariffa:", error);
    } else {
      showSuccess("Tariffa salvata con successo!");
      methods.reset();
      setHasAppliedPrefill(false);
      invalidateTariffeCache();
    }
  };

  if (loading) {
    return <div>Caricamento dati anagrafici...</div>;
  }

  return (
    <FormProvider {...methods}>
      <Form {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
          <h3 className="text-lg font-semibold">Dettagli Tariffa</h3>
          
          <TariffCoreDetails clienti={clienti} loading={loading} />
          <TariffRateFields />
          <TariffAssociationFields puntiServizio={puntiServizio} fornitori={fornitori} />
          <TariffValidityFields />
          <TariffNotesField />

          <Button type="submit" className="w-full">Salva Tariffa</Button>
        </form>
      </Form>
    </FormProvider>
  );
}