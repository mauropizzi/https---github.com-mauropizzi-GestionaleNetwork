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
  danniVeicolo: z.string().min(1, "Danni veicolo è richiesto."),
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

export default function ServiceReportForm() {
  const [personaleList, setPersonaleList] = useState<Personale[]>([]);
  const [puntiServizioList, setPuntiServizioList] = useState<PuntoServizio[]>([]);
  const [isEmployeeSelectOpen, setIsEmployeeSelectOpen] = useState(false);
  const [isServicePointSelectOpen, setIsServicePointSelectOpen] = useState(false);
  const [loadingDropdowns, setLoadingDropdowns] = useState(true); // Keep this for dropdowns

  useEffect(() => {
    const loadData = async () => {
      setLoadingDropdowns(true); // Set loading true at start
      const fetchedPersonale = await fetchPersonale();
      setPersonaleList(fetchedPersonale);
      const fetchedPuntiServizio = await fetchPuntiServizio();
      setPuntiServizioList(fetchedPuntiServizio);
      setLoadingDropdowns(false); // Set loading false after all fetches
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
      danniVeicolo: "",
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

  const selectedVehiclePlate = methods.watch("vehiclePlate");
  const vehicleInitialState = methods.watch("vehicleInitialState");
  const employeeId = methods.watch("employeeId");

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
          methods.setValue("startKm", data.end_km, { shouldValidate: true });
          showInfo(`KM Iniziali pre-compilati con l'ultimo KM finale (${data.end_km}) per la targa ${selectedVehiclePlate}.`);
        } else {
          methods.setValue("startKm", 0, { shouldValidate: true });
          showInfo(`Nessun KM precedente trovato per la targa ${selectedVehiclePlate}. KM Iniziali impostati a 0.`);
        }
      } else {
        methods.setValue("startKm", 0, { shouldValidate: true });
      }
    };

    fetchLastKm();
  }, [selectedVehiclePlate, methods]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    console.log("Dati Rapporto di Servizio:", values);

    const selectedServicePoint = puntiServizioList.find(p => p.id === values.servicePointId);
    const servicePointName = selectedServicePoint?.nome_punto_servizio || 'N/A';

    const payload = {
      service_date: format(values.serviceDate, 'yyyy-MM-dd'),
      employee_id: values.employeeId,
      service_location: servicePointName,
      service_location_id: values.servicePointId, // Now saving the ID
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

    const { data, error } = await supabase
      .from('rapporti_servizio')
      .insert([payload])
      .select(); // Select the inserted data to get its ID

    if (error) {
      showError(`Errore durante la registrazione del rapporto: ${error.message}`);
      console.error("Error inserting service report:", error);
      return;
    }

    const newReportId = data?.[0]?.id;

    // Create maintenance ticket if vehicleInitialState is "RICHIESTA MANUTENZIONE"
    if (values.vehicleInitialState === "RICHIESTA MANUTENZIONE" && newReportId) {
      const maintenanceIssueDescription = `Veicolo: ${values.vehicleMakeModel} (${values.vehiclePlate}), Stato Iniziale: ${values.vehicleInitialState}, Danni: ${values.danniVeicolo}. Anomalie: ${values.vehicleAnomalies || 'Nessuna'}.`;
      const { error: maintenanceError } = await supabase
        .from('richieste_manutenzione')
        .insert({
          report_id: newReportId,
          service_point_id: values.servicePointId,
          vehicle_plate: values.vehiclePlate,
          issue_description: maintenanceIssueDescription,
          status: 'Pending',
          priority: 'Medium',
          requested_by_employee_id: values.employeeId,
        });

      if (maintenanceError) {
        showError(`Errore durante la creazione del ticket di manutenzione: ${maintenanceError.message}`);
        console.error("Error creating maintenance ticket:", maintenanceError);
      } else {
        showSuccess("Ticket di manutenzione creato con successo!");
      }
    }

    showSuccess("Rapporto di servizio registrato con successo!");
    console.log("Service report saved successfully:", data);
    methods.reset();
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
    // For new reports, we don't have a reportId yet, so we generate PDF from current form values
    // This requires a utility function that can take form values directly or a temporary ID
    // For simplicity, I'll adapt generateDotazioniReportPdfBlob to take values directly if no ID.
    // NOTE: The existing generateDotazioniReportPdfBlob expects an ID and fetches from DB.
    // For a new report, we need to pass the form data directly.
    // I will modify printReport.ts to support this.
    const pdfBlob = await generateDotazioniReportPdfBlob(undefined, values, personaleList, puntiServizioList);

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
    // Same as above, for new reports, generate from current form values
    const pdfBlob = await generateDotazioniReportPdfBlob(undefined, values, personaleList, puntiServizioList);
    if (pdfBlob) {
      const url = URL.createObjectURL(pdfBlob);
      window.open(url, '_blank');
      showSuccess("PDF generato con successo!");
    } else {
      showError("Impossibile generare il PDF.");
    }
  });

  if (loadingDropdowns) { // Only check for dropdown loading
    return <div className="text-center py-8">Caricamento dati...</div>;
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
          isEditMode={false}
          vehicleInitialState={vehicleInitialState}
          handleEmail={handleEmail}
          handlePrintPdf={handlePrintPdf}
        />
      </form>
    </FormProvider>
  );
}