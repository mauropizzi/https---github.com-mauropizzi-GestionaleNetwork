import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { EventDetailsSection } from './EventDetailsSection';
import { InterventionTimesSection } from './InterventionTimesSection';
import { AccessDetailsSection } from './AccessDetailsSection';
import { PersonnelSection } from './PersonnelSection';
import { AnomaliesDelaySection } from './AnomaliesDelaySection';
import { OutcomeBarcodeSection } from './OutcomeBarcodeSection';
import { InterventionActionButtons } from './InterventionActionButtons';

const interventionSchema = z.object({
  // Event Details
  event_type: z.string().min(1, "Tipo evento è richiesto"),
  event_date: z.date(),
  event_time: z.string().min(1, "Ora evento è richiesta"),
  service_point_id: z.string().min(1, "Punto di servizio è richiesto"),
  alarm_code: z.string().optional(),
  alarm_details: z.string().optional(),
  intervention_type: z.string().min(1, "Tipo intervento è richiesto"),
  intervention_description: z.string().min(1, "Descrizione intervento è richiesta"),

  // Intervention Times
  departure_time: z.string().optional(),
  arrival_time: z.string().optional(),
  start_intervention_time: z.string().optional(),
  end_intervention_time: z.string().optional(),
  return_time: z.string().optional(),

  // Access Details
  access_type: z.string().optional(),
  access_notes: z.string().optional(),

  // Personnel
  personnel_id: z.string().optional(),
  personnel_notes: z.string().optional(),

  // Anomalies and Delay
  anomalies_found: z.boolean().optional(),
  anomaly_description: z.string().optional(),
  delay_occurred: z.boolean().optional(),
  delay_reason: z.string().optional(),

  // Outcome and Barcode
  intervention_outcome: z.string().optional(),
  barcode_scanned: z.string().optional(),
  notes: z.string().optional(),
});

type InterventionFormValues = z.infer<typeof interventionSchema>;

interface InterventionFormProps {
  defaultValues?: Partial<InterventionFormValues>;
  onSubmit: (values: InterventionFormValues) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

export function InterventionForm({ defaultValues, onSubmit, onCancel, isSubmitting }: InterventionFormProps) {
  const form = useForm<InterventionFormValues>({
    resolver: zodResolver(interventionSchema),
    defaultValues: {
      event_date: new Date(),
      event_time: new Date().toTimeString().slice(0, 5),
      intervention_type: "Ronda", // Default value
      ...defaultValues,
    },
  });

  const handleSubmit = (values: InterventionFormValues) => {
    onSubmit(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <EventDetailsSection form={form} />
        <InterventionTimesSection form={form} />
        <AccessDetailsSection form={form} />
        <PersonnelSection form={form} />
        <AnomaliesDelaySection form={form} />
        <OutcomeBarcodeSection form={form} />
        <InterventionActionButtons onCancel={onCancel} isSubmitting={isSubmitting} />
      </form>
    </Form>
  );
}