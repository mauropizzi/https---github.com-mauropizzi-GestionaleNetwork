import React, { useEffect, useRef, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Textarea } from "@/components/ui/textarea";
import { showSuccess, showError } from "@/utils/toast";
import { supabase } from '@/integrations/supabase/client';
import {
  servicePointsData,
  requestTypeOptions,
  coOperatorOptions,
  operatorClientOptions,
  gpgInterventionOptions,
  serviceOutcomeOptions,
} from '@/lib/centrale-data';

interface AllarmeIntervento {
  id: string;
  report_date: string; // ISO date string
  report_time: string; // HH:MM:SS string
  service_point_code: string;
  request_type: string;
  co_operator?: string;
  operator_client?: string;
  gpg_intervention?: string;
  service_outcome?: string; // This should be null for "in progress"
  notes?: string;
  latitude?: number;
  longitude?: number;
}

interface EditInterventionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  event: AllarmeIntervento | null;
  onSave: (updatedEvent: AllarmeIntervento) => void;
}

// Ho commentato lo schema del form per la semplificazione temporanea
// const formSchema = z.object({
//   id: z.string().uuid(),
//   report_date: z.string().min(1, "La data del rapporto è richiesta."),
//   report_time: z.string().min(1, "L'ora del rapporto è richiesta."),
//   service_point_code: z.string().min(1, "Il punto servizio è richiesto."),
//   request_type: z.string().min(1, "Il tipo di richiesta è richiesto."),
//   co_operator: z.string().optional().or(z.literal("")),
//   operator_client: z.string().optional().or(z.literal("")),
//   gpg_intervention: z.string().optional().or(z.literal("")),
//   service_outcome: z.string().nullish(),
//   notes: z.string().optional().or(z.literal("")),
//   latitude: z.coerce.number().optional().nullable(),
//   longitude: z.coerce.number().optional().nullable(),
// });

export const EditInterventionDialog = React.memo(({ isOpen, onClose, event, onSave }: EditInterventionDialogProps) => {
  console.log("EditInterventionDialog: Component rendered. isOpen:", isOpen, "event ID:", event?.id);

  // Ho commentato l'uso di useForm e la logica correlata per la semplificazione temporanea
  // const defaultValues = useMemo(() => {
  //   console.log("EditInterventionDialog: useMemo calculating defaultValues for event:", event?.id);
  //   return {
  //     id: event?.id || '',
  //     report_date: event?.report_date || '',
  //     report_time: event?.report_time || '',
  //     service_point_code: event?.service_point_code || '',
  //     request_type: event?.request_type || '',
  //     co_operator: event?.co_operator ?? "",
  //     operator_client: event?.operator_client ?? "",
  //     gpg_intervention: event?.gpg_intervention ?? "",
  //     service_outcome: event?.service_outcome ?? null,
  //     notes: event?.notes ?? "",
  //     latitude: event?.latitude ?? undefined,
  //     longitude: event?.longitude ?? undefined,
  //   };
  // }, [event]);

  // const form = useForm<z.infer<typeof formSchema>>({
  //   resolver: zodResolver(formSchema),
  //   defaultValues: defaultValues,
  // });

  // useEffect(() => {
  //   console.log("EditInterventionDialog: useEffect triggered. isOpen:", isOpen, "event ID:", event?.id);
  //   if (isOpen && event) {
  //     try {
  //       form.reset(defaultValues);
  //       console.log("EditInterventionDialog: form.reset successful with values:", defaultValues);
  //     } catch (e: any) {
  //       console.error("EditInterventionDialog: Error during form.reset:", e);
  //       showError(`Errore durante il reset del modulo: ${e.message}`);
  //     }
  //   } else if (!isOpen) {
  //     try {
  //       form.reset();
  //       console.log("EditInterventionDialog: form.reset (empty) successful on close.");
  //     } catch (e: any) {
  //       console.error("EditInterventionDialog: Error during form.reset on close:", e);
  //     }
  //   }
  // }, [isOpen, event, form, defaultValues]);


  // const onSubmit = async (values: z.infer<typeof formSchema>) => {
  //   console.log("EditInterventionDialog: onSubmit called with values:", values);
  //   if (!event) {
  //     showError("Nessun evento selezionato per la modifica.");
  //     return;
  //   }

  //   const payload = {
  //     report_date: values.report_date,
  //     report_time: values.report_time,
  //     service_point_code: values.service_point_code,
  //     request_type: values.request_type,
  //     co_operator: values.co_operator || null,
  //     operator_client: values.operator_client || null,
  //     gpg_intervention: values.gpg_intervention || null,
  //     service_outcome: values.service_outcome || null,
  //     notes: values.notes || null,
  //     latitude: values.latitude || null,
  //     longitude: values.longitude || null,
  //   };

  //   console.log("EditInterventionDialog: Supabase update payload:", payload);

  //   const { data, error } = await supabase
  //     .from('allarme_interventi')
  //     .update(payload)
  //     .eq('id', values.id)
  //     .select();

  //   if (error) {
  //     showError(`Errore durante l'aggiornamento dell'evento: ${error.message}`);
  //     console.error("Error updating alarm event:", error);
  //   } else {
  //     showSuccess(`Evento ${values.id} aggiornato con successo!`);
  //     console.log("EditInterventionDialog: Supabase update successful, data:", data);
  //     if (data && data.length > 0) {
  //       onSave(data[0] as AllarmeIntervento);
  //     }
  //     onClose();
  //   }
  // };

  if (!event) {
    console.log("EditInterventionDialog: Not rendering because event is null.");
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifica Evento Allarme: {event.id}</DialogTitle>
          <DialogDescription>
            Test di apertura del dialog.
          </DialogDescription>
        </DialogHeader>
        <div className="p-4">
          <p>Questo è un test. Il dialog si è aperto correttamente.</p>
          <p>ID Evento: {event.id}</p>
          <p>Data: {event.report_date}</p>
          <p>Ora: {event.report_time}</p>
          <p>Punto Servizio: {event.service_point_code}</p>
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Chiudi</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

EditInterventionDialog.displayName = 'EditInterventionDialog';