import React, { useState, useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, parseISO, isValid } from "date-fns";
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { showSuccess, showError, showInfo } from "@/utils/toast";
import { sendEmail } from "@/utils/email";
import { supabase } from "@/integrations/supabase/client";
import {
  vehicleMakeModelOptions,
  vehiclePlateOptions,
  vehicleInitialStateOptions,
  vehicleDamageOptions,
} from "@/lib/dotazioni-data";
import { Personale, PuntoServizio } from "@/lib/anagrafiche-data";
import { fetchPersonale, fetchPuntiServizio } from "@/lib/data-fetching";
import { generateDotazioniReportPdfBlob } from "@/utils/printReport";

// Import modular components
import { ReportDetailsSection } from "./report-form/ReportDetailsSection";
import { VehicleDetailsSection } from "./report-form/VehicleDetailsSection";
import { EquipmentCheckSection } from "./report-form/EquipmentCheckSection";
import { ReportActionButtons } from "./report-form/ReportActionButtons";

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
  danniVeicolo: z.string().optional().nullable(),
  vehicleAnomalies: z.string().optional().nullable(),
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

interface ServiceReportFormProps {
  reportId?: string; // Optional ID for editing
  onSaveSuccess?: () => void; // Callback for successful save/update
  onCancel?: () => void; // Callback for cancel
}

export default function ServiceReportForm({ reportId, onSaveSuccess, onCancel }: ServiceReportFormProps) {
  const [personaleList, setPersonaleList] = useState<Personale[]>([]);
  const [puntiServizioList, setPuntiServizioList] = useState<PuntoServizio[]>([]);
  const [isEmployeeSelectOpen, setIsEmployeeSelectOpen] = useState(false);
  const [isServicePointSelectOpen, setIsServicePointSelectOpen] = useState(false);
  const [loadingDropdowns, setLoadingDropdowns] = useState(true);
  const [loadingInitialReport, setLoadingInitialReport] = useState(!!reportId);

  useEffect(() => {
    const loadData = async () => {
      setLoadingDropdowns(true);
      const fetchedPersonale = await fetchPersonale();
      setPersonaleList(fetchedPersonale);
      const fetchedPuntiServizio = await fetchPuntiServizio();
      setPuntiServizioList(fetchedPuntiServizio);
      setLoadingDropdowns(false);
    };
    loadData();
  }, []);

  const methods = useForm<z.infer<typeof formSchema>>({
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
      danniVeicolo: null,
      vehicleAnomalies: null,
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

  useEffect(() => {
    const fetchReportData = async () => {
      if (reportId && !loadingDropdowns) {
        setLoadingInitialReport(true);
        const { data: report, error } = await supabase
          .from('rapporti_servizio')
          .select('*')
          .eq('id', reportId)
          .single();

        if (error) {
          showError(`Errore nel recupero del rapporto: ${error.message}`);
          console.error("Error fetching service report for edit:", error);
          setLoadingInitialReport(false);
          return;
        }

        if (report) {
          methods.reset({
            serviceDate: (report.service_date && typeof report.service_date === 'string') ? parseISO(report.service_date) : new Date(),
            employeeId: report.employee_id || "",
            servicePointId: report.service_location_id || "",
            serviceType: report.service_type || "",
            startTime: report.start_time || "09:00",
            endTime: report.end_time || "17:00",
            vehicleMakeModel: report.vehicle_make_model || "",
            vehiclePlate: report.vehicle_plate || "",
            startKm: report.start_km || 0,
            endKm: report.end_km || 0,
            vehicleInitialState: report.vehicle_initial_state || "",
            danniVeicolo: report.danni_veicolo || null,
            vehicleAnomalies: report.vehicle_anomalies || null,
            gps: report.gps ? 'si' : 'no',
            radioVehicle: report.radio_vehicle ? 'si' : 'no',
            swivelingLamp: report.swiveling_lamp ? 'si' : 'no',
            radioPortable: report.radio_portable ? 'si' : 'no',
            flashlight: report.flashlight ? 'si' : 'no',
            extinguisher: report.extinguisher ? 'si' : 'no',
            spareTire: report.spare_tire ? 'si' : 'no',
            highVisibilityVest: report.high_visibility_vest ? 'si' : 'no',
          });
        }
        setLoadingInitialReport(false);
      } else if (!reportId) { // If no reportId, ensure loading is false
        setLoadingInitialReport(false);
      }
    };

    fetchReportData();
  }, [reportId, loadingDropdowns, methods]);

  const selectedVehiclePlate = methods.watch("vehiclePlate");
  const vehicleInitialState = methods.watch("vehicleInitialState");
  const employeeId = methods.watch("employeeId");

  useEffect(() => {
    const fetchLastKm = async () => {
      if (selectedVehiclePlate && !reportId) { // Only fetch for new reports
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
          methods.setValue("startKm", data.end_km, { shouldValidate: true });
          showInfo(`KM Iniziali pre-compilati con l'ultimo KM finale (${data.end_km}) per la targa ${selectedVehiclePlate}.`);
        } else {
          methods.setValue("startKm", 0, { shouldValidate: true });
          showInfo(`Nessun KM precedente trovato per la targa ${selectedVehiclePlate}. KM Iniziali impostati a 0.`);
        }
      } else if (!reportId) { // For new reports, if no plate selected, reset to 0
        methods.setValue("startKm", 0, { shouldValidate: true });
      }
    };

    fetchLastKm();
  }, [selectedVehiclePlate, methods, reportId]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    console.log("Dati Rapporto di Servizio:", values);

    const selectedServicePoint = puntiServizioList.find(p => p.id === values.servicePointId);
    const servicePointName = selectedServicePoint?.nome_punto_servizio || 'N/A';

    const payload = {
      service_date: format(values.serviceDate, 'yyyy-MM-dd'),
      employee_id: values.employeeId,
      service_location: servicePointName,
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

    let result;
    let currentReportId = reportId;

    if (reportId) {
      result = await supabase
        .from('rapporti_servizio')
        .update(payload)
        .eq('id', reportId);
    } else {
      result = await supabase
        .from('rapporti_servizio')
        .insert([payload])
        .select();
      currentReportId = result.data?.[0]?.id;
    }

    if (result.error) {
      showError(`Errore durante la ${reportId ? 'modifica' : 'registrazione'} del rapporto: ${result.error.message}`);
      console.error(`Error ${reportId ? 'updating' : 'inserting'} service report:`, result.error);
      return;
    }

    // Handle maintenance ticket logic
    if (values.vehicleInitialState === "RICHIESTA MANUTENZIONE" && currentReportId) {
      const maintenanceIssueDescription = `Veicolo: ${values.vehicleMakeModel} (${values.vehiclePlate}), Stato Iniziale: ${values.vehicleInitialState}, Danni: ${values.danniVeicolo}. Anomalie: ${values.vehicleAnomalies || 'Nessuna'}.`;
      
      const { data: existingTicket, error: fetchTicketError } = await supabase
        .from('richieste_manutenzione')
        .select('id')
        .eq('report_id', currentReportId)
        .single();

      if (fetchTicketError && fetchTicketError.code !== 'PGRST116') {
        console.error("Error checking for existing maintenance ticket:", fetchTicketError);
        showError(`Errore durante la verifica del ticket di manutenzione esistente: ${fetchTicketError.message}`);
        return;
      }

      if (existingTicket) {
        const { error: updateTicketError } = await supabase
          .from('richieste_manutenzione')
          .update({
            service_point_id: values.servicePointId,
            vehicle_plate: values.vehiclePlate,
            issue_description: maintenanceIssueDescription,
            requested_by_employee_id: values.employeeId,
          })
          .eq('id', existingTicket.id);

        if (updateTicketError) {
          showError(`Errore durante l'aggiornamento del ticket di manutenzione: ${updateTicketError.message}`);
          console.error("Error updating maintenance ticket:", updateTicketError);
        } else {
          showSuccess("Ticket di manutenzione aggiornato con successo!");
        }
      } else {
        const { error: createTicketError } = await supabase
          .from('richieste_manutenzione')
          .insert({
            report_id: currentReportId,
            service_point_id: values.servicePointId,
            vehicle_plate: values.vehiclePlate,
            issue_description: maintenanceIssueDescription,
            status: 'Pending',
            priority: 'Medium',
            requested_by_employee_id: values.employeeId,
          });

        if (createTicketError) {
          showError(`Errore durante la creazione del ticket di manutenzione: ${createTicketError.message}`);
          console.error("Error creating maintenance ticket:", createTicketError);
        } else {
          showSuccess("Nuovo ticket di manutenzione creato con successo!");
        }
      }
    } else if (currentReportId) {
      const { error: deleteTicketError } = await supabase
        .from('richieste_manutenzione')
        .delete()
        .eq('report_id', currentReportId);
      
      if (deleteTicketError && deleteTicketError.code !== 'PGRST116') {
        console.error("Error deleting maintenance ticket:", deleteTicketError);
        showError(`Errore durante l'eliminazione del ticket di manutenzione: ${deleteTicketError.message}`);
      } else if (deleteTicketError?.code === 'PGRST116') {
        // No ticket found to delete, which is fine
      } else {
        showInfo("Ticket di manutenzione rimosso (stato veicolo non richiede manutenzione).");
      }
    }

    showSuccess(`Rapporto di servizio ${reportId ? 'aggiornato' : 'registrato'} con successo!`);
    console.log("Service report saved successfully:", result.data);
    methods.reset();
    onSaveSuccess?.();
  };

  const handleSetCurrentTime = (field: "startTime" | "endTime") => {
    methods.setValue(field, format(new Date(), "HH:mm"));
  };

  const handleEmail = methods.handleSubmit(async (values) => {
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
    const pdfBlob = await generateDotazioniReportPdfBlob(reportId, values as DotazioniFormValues, personaleList, puntiServizioList);

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

  const handlePrintPdf = methods.handleSubmit(async (values) => {
    showInfo("Generazione PDF per la stampa...");
    const pdfBlob = await generateDotazioniReportPdfBlob(reportId, values as DotazioniFormValues, personaleList, puntiServizioList);
    if (pdfBlob) {
      const url = URL.createObjectURL(pdfBlob);
      window.open(url, '_blank');
      showSuccess("PDF generato con successo!");
    } else {
      showError("Impossibile generare il PDF.");
    }
  });

  if (loadingDropdowns || loadingInitialReport) {
    return (
      <div className="text-center py-8">
        Caricamento dati rapporto...
      </div>
    );
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6 p-4">
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
          vehicleInitialState={vehicleInitialState}
          handleEmail={handleEmail}
          handlePrintPdf={handlePrintPdf}
          onCancel={onCancel}
        />
      </form>
    </FormProvider>
  );
}