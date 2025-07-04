import React, { useState, useEffect, useCallback } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, parseISO, isValid } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess, showInfo } from "@/utils/toast";
import { RapportoServizio, Personale, PuntoServizio } from "@/lib/anagrafiche-data";
import { fetchPersonale, fetchPuntiServizio } from "@/lib/data-fetching";
import { sendEmail } from "@/utils/email";
import { generateDotazioniReportPdfBlob } from "@/utils/printReport";

// Import modular components
import { ReportDetailsSection } from "./report-form/ReportDetailsSection";
import { VehicleDetailsSection } from "./report-form/VehicleDetailsSection";
import { EquipmentCheckSection } from "./report-form/EquipmentCheckSection";
import { ReportActionButtons } from "./report-form/ReportActionButtons";

const formSchema = z.object({
  serviceDate: z.date({ required_error: "La data del servizio è richiesta." }),
  employeeId: z.string().uuid("Seleziona un dipendente valido.").nonempty("Il dipendente è richiesto."),
  servicePointId: z.string().uuid("Seleziona un punto servizio valido.").nonempty("Il punto servizio è richiesto."),
  serviceType: z.string().min(1, "Il tipo di servizio è richiesto."),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato ora non valido (HH:MM)."),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato ora non valido (HH:MM)."),
  vehicleMakeModel: z.string().min(1, "La marca/modello del veicolo è richiesta."),
  vehiclePlate: z.string().min(1, "La targa del veicolo è richiesta."),
  startKm: z.coerce.number().min(0, "I KM iniziali devono essere un numero positivo."),
  endKm: z.coerce.number().min(0, "I KM finali devono essere un numero positivo."),
  vehicleInitialState: z.string().min(1, "Lo stato del veicolo è richiesto."),
  danniVeicolo: z.string().optional().nullable(),
  vehicleAnomalies: z.string().optional().nullable(),
  gps: z.enum(['si', 'no'], { required_error: "Seleziona un'opzione per il GPS." }),
  radioVehicle: z.enum(['si', 'no'], { required_error: "Seleziona un'opzione per la Radio Veicolare." }),
  swivelingLamp: z.enum(['si', 'no'], { required_error: "Seleziona un'opzione per il Faro Girevole." }),
  radioPortable: z.enum(['si', 'no'], { required_error: "Seleziona un'opzione per la Radio Portatile." }),
  flashlight: z.enum(['si', 'no'], { required_error: "Seleziona un'opzione per la Torcia." }),
  extinguisher: z.enum(['si', 'no'], { required_error: "Seleziona un'opzione per l'Estintore." }),
  spareTire: z.enum(['si', 'no'], { required_error: "Seleziona un'opzione per la Ruota di Scorta." }),
  highVisibilityVest: z.enum(['si', 'no'], { required_error: "Seleziona un'opzione per il Giubbotto Alta Visibilità." }),
}).refine(data => data.endKm >= data.startKm, {
  message: "I KM finali non possono essere inferiori a quelli iniziali.",
  path: ["endKm"],
});

type DotazioniFormValues = z.infer<typeof formSchema>;

interface ServiceReportFormProps {
  reportId?: string;
  onSaveSuccess?: () => void;
  onCancel?: () => void;
}

export function ServiceReportForm({ reportId, onSaveSuccess, onCancel }: ServiceReportFormProps) {
  const [personaleList, setPersonaleList] = useState<Personale[]>([]);
  const [puntiServizioList, setPuntiServizioList] = useState<PuntoServizio[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEmployeeSelectOpen, setIsEmployeeSelectOpen] = useState(false);
  const [isServicePointSelectOpen, setIsServicePointSelectOpen] = useState(false);

  const methods = useForm<DotazioniFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      serviceDate: new Date(),
      employeeId: "",
      servicePointId: "",
      serviceType: "",
      startTime: format(new Date(), "HH:mm"),
      endTime: format(new Date(), "HH:mm"),
      vehicleMakeModel: "",
      vehiclePlate: "",
      startKm: 0,
      endKm: 0,
      vehicleInitialState: "",
      danniVeicolo: null,
      vehicleAnomalies: null,
      gps: 'no',
      radioVehicle: 'no',
      swivelingLamp: 'no',
      radioPortable: 'no',
      flashlight: 'no',
      extinguisher: 'no',
      spareTire: 'no',
      highVisibilityVest: 'no',
    },
  });

  useEffect(() => {
    const fetchDependencies = async () => {
      setLoading(true);
      const [personale, puntiServizio] = await Promise.all([
        fetchPersonale(),
        fetchPuntiServizio(),
      ]);
      setPersonaleList(personale);
      setPuntiServizioList(puntiServizio);
      setLoading(false);
    };
    fetchDependencies();
  }, []);

  useEffect(() => {
    const fetchReportData = async () => {
      if (reportId && !loading) {
        setLoading(true);
        const { data, error } = await supabase
          .from('rapporti_servizio')
          .select('*')
          .eq('id', reportId)
          .single();

        if (error) {
          showError(`Errore nel recupero del report: ${error.message}`);
        } else if (data) {
          methods.reset({
            serviceDate: parseISO(data.service_date),
            employeeId: data.employee_id,
            servicePointId: data.service_location_id || '',
            serviceType: data.service_type,
            startTime: data.start_time,
            endTime: data.end_time,
            vehicleMakeModel: data.vehicle_make_model,
            vehiclePlate: data.vehicle_plate,
            startKm: data.start_km,
            endKm: data.end_km,
            vehicleInitialState: data.vehicle_initial_state,
            danniVeicolo: data.danni_veicolo,
            vehicleAnomalies: data.vehicle_anomalies,
            gps: data.gps ? 'si' : 'no',
            radioVehicle: data.radio_vehicle ? 'si' : 'no',
            swivelingLamp: data.swiveling_lamp ? 'si' : 'no',
            radioPortable: data.radio_portable ? 'si' : 'no',
            flashlight: data.flashlight ? 'si' : 'no',
            extinguisher: data.extinguisher ? 'si' : 'no',
            spareTire: data.spare_tire ? 'si' : 'no',
            highVisibilityVest: data.high_visibility_vest ? 'si' : 'no',
          });
        }
        setLoading(false);
      }
    };
    fetchReportData();
  }, [reportId, loading, methods]);

  const handleSetCurrentTime = useCallback((field: "startTime" | "endTime") => {
    methods.setValue(field, format(new Date(), "HH:mm"));
  }, [methods]);

  const onSubmit = async (values: DotazioniFormValues) => {
    const serviceLocationName = puntiServizioList.find(p => p.id === values.servicePointId)?.nome_punto_servizio || 'N/A';

    const payload = {
      service_date: format(values.serviceDate, "yyyy-MM-dd"),
      employee_id: values.employeeId,
      service_location: serviceLocationName,
      service_location_id: values.servicePointId,
      service_type: values.serviceType,
      start_time: values.startTime,
      end_time: values.endTime,
      vehicle_make_model: values.vehicleMakeModel,
      vehicle_plate: values.vehiclePlate,
      start_km: values.startKm,
      end_km: values.endKm,
      vehicle_initial_state: values.vehicleInitialState,
      danni_veicolo: values.danniVeicolo,
      vehicle_anomalies: values.vehicleAnomalies,
      gps: values.gps === 'si',
      radio_vehicle: values.radioVehicle === 'si',
      swiveling_lamp: values.swivelingLamp === 'si',
      radio_portable: values.radioPortable === 'si',
      flashlight: values.flashlight === 'si',
      extinguisher: values.extinguisher === 'si',
      spare_tire: values.spareTire === 'si',
      high_visibility_vest: values.highVisibilityVest === 'si',
    };

    let result;
    if (reportId) {
      result = await supabase.from('rapporti_servizio').update(payload).eq('id', reportId);
    } else {
      result = await supabase.from('rapporti_servizio').insert([payload]);
    }

    if (result.error) {
      showError(`Errore nel salvataggio del report: ${result.error.message}`);
    } else {
      showSuccess(`Report ${reportId ? 'aggiornato' : 'creato'} con successo!`);
      if (values.vehicleInitialState === "RICHIESTA MANUTENZIONE") {
        await createMaintenanceRequest(values, serviceLocationName);
      }
      onSaveSuccess?.();
    }
  };

  const createMaintenanceRequest = async (formValues: DotazioniFormValues, serviceLocationName: string) => {
    const payload = {
      report_id: reportId,
      service_point_id: formValues.servicePointId,
      vehicle_plate: formValues.vehiclePlate,
      issue_description: `Richiesta di manutenzione da rapporto di servizio. Stato veicolo: ${formValues.vehicleInitialState}. Danni: ${formValues.danniVeicolo || 'Nessuno'}. Anomalie: ${formValues.vehicleAnomalies || 'Nessuna'}.`,
      status: "Pending",
      priority: "Medium",
      requested_by_employee_id: formValues.employeeId,
      requested_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('richieste_manutenzione').insert([payload]);
    if (error) {
      showError(`Errore nella creazione della richiesta di manutenzione: ${error.message}`);
    } else {
      showSuccess("Richiesta di manutenzione creata e inviata con successo.");
      await handleEmail();
    }
  };

  const handleEmail = async () => {
    const values = methods.getValues();
    if (values.vehicleInitialState !== "RICHIESTA MANUTENZIONE") {
      showInfo("Nessuna richiesta di manutenzione da inviare.");
      return;
    }
    if (!values.serviceDate) {
      showError("Data del servizio non specificata. Impossibile inviare l'email.");
      return;
    }
    const subject = `Richiesta Manutenzione Veicolo - Targa: ${values.vehiclePlate}`;
    const body = `
      È stata generata una nuova richiesta di manutenzione per il veicolo con targa ${values.vehiclePlate}.

      Dettagli:
      - Stato Veicolo: ${values.vehicleInitialState}
      - Danni Rilevati: ${values.danniVeicolo || 'Nessuno'}
      - Anomalie Descritte: ${values.vehicleAnomalies || 'Nessuna'}
      - Dipendente: ${personaleList.find(p => p.id === values.employeeId)?.nome || 'N/A'} ${personaleList.find(p => p.id === values.employeeId)?.cognome || ''}
      - Data: ${format(values.serviceDate, 'dd/MM/yyyy')}

      Si prega di prendere visione della richiesta nella sezione "Richiesta Manutenzione" dell'app.
    `;
    await sendEmail(subject, body);
  };

  const handlePrintPdf = async () => {
    const values = methods.getValues();
    const pdfBlob = await generateDotazioniReportPdfBlob(undefined, values, personaleList, puntiServizioList);
    if (pdfBlob) {
      const url = URL.createObjectURL(pdfBlob);
      window.open(url, '_blank');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Caricamento dati...</div>;
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
          <ReportDetailsSection
            personaleList={personaleList}
            puntiServizioList={puntiServizioList}
            isEmployeeSelectOpen={isEmployeeSelectOpen}
            setIsEmployeeSelectOpen={setIsEmployeeSelectOpen}
            isServicePointSelectOpen={isServicePointSelectOpen}
            setIsServicePointSelectOpen={setIsServicePointSelectOpen}
            handleSetCurrentTime={handleSetCurrentTime}
          />
          <VehicleDetailsSection />
          <EquipmentCheckSection />
          <ReportActionButtons
            isEditMode={!!reportId}
            vehicleInitialState={methods.watch("vehicleInitialState")}
            handleEmail={handleEmail}
            handlePrintPdf={handlePrintPdf}
            onCancel={onCancel}
          />
        </form>
    </FormProvider>
  );
}