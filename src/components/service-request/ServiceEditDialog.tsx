import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { showSuccess, showError } from "@/utils/toast";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns"; // Import format and parseISO

// Standardized ServiceRequest interface to match the data fetched from Supabase
interface ServiceRequest {
  id: string;
  type: string;
  client_id?: string | null;
  service_point_id?: string | null;
  start_date: string;
  start_time?: string | null;
  end_date: string;
  end_time?: string | null;
  status: "Pending" | "Approved" | "Rejected" | "Completed";
  calculated_cost?: number | null;
  num_agents?: number | null;
  cadence_hours?: number | null;
  inspection_type?: string | null;
  daily_hours_config?: any | null;
  fornitore_id?: string | null;

  clienti?: { nome_cliente: string } | null;
  punti_servizio?: { nome_punto_servizio: string; id_cliente: string | null } | null;
}

interface ServiceEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  service: ServiceRequest | null;
  onSave: (updatedService: ServiceRequest) => void;
}

const formSchema = z.object({
  type: z.string().min(1, "Il tipo di servizio è richiesto."),
  // client and location are display-only, not part of the form's editable schema
  status: z.enum(["Pending", "Approved", "Rejected", "Completed"], {
    required_error: "Lo stato è richiesto.",
  }),
});

export function ServiceEditDialog({ isOpen, onClose, service, onSave }: ServiceEditDialogProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "",
      status: "Pending",
    },
  });

  React.useEffect(() => {
    if (service) {
      // Reset form only when the service ID changes, or when the dialog is opened with a new service
      form.reset({
        type: service.type,
        status: service.status,
      });
    }
  }, [service?.id, form]); // Depend on service.id to prevent infinite re-renders

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!service) {
      showError("Nessun servizio selezionato per la modifica.");
      return;
    }

    // Reconstruct the payload using original service data and updated form values
    const payload = {
      ...service, // Start with all original fields
      type: values.type,
      status: values.status,
    };

    // Recalculate cost based on potentially updated values (even if only type/status are editable now)
    // This part should ideally be handled by a server-side function or a more robust client-side calculation
    // if the type change affects the cost significantly. For now, we'll re-use the existing client-side logic.
    const costDetails = {
      type: payload.type,
      client_id: payload.client_id,
      service_point_id: payload.service_point_id,
      fornitore_id: payload.fornitore_id,
      start_date: parseISO(payload.start_date),
      end_date: parseISO(payload.end_date),
      start_time: payload.start_time,
      end_time: payload.end_time,
      num_agents: payload.num_agents,
      cadence_hours: payload.cadence_hours,
      daily_hours_config: payload.daily_hours_config,
      inspection_type: payload.inspection_type,
    };
    
    // Assuming calculateServiceCost is available and works with the payload structure
    const { calculateServiceCost } = await import('@/lib/data-fetching'); // Dynamic import to avoid circular dependency if data-fetching imports this
    const calculatedRates = await calculateServiceCost(costDetails);
    payload.calculated_cost = calculatedRates ? (calculatedRates.multiplier * calculatedRates.clientRate) : null;

    const { data, error } = await supabase
      .from('servizi_richiesti')
      .update({
        type: payload.type,
        status: payload.status,
        calculated_cost: payload.calculated_cost,
      })
      .eq('id', service.id)
      .select();

    if (error) {
      showError(`Errore durante l'aggiornamento del servizio: ${error.message}`);
      console.error("Error updating service:", error);
    } else {
      showSuccess(`Servizio ${service.id} aggiornato con successo!`);
      onSave(payload); // Pass the updated service back to the parent
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Modifica Servizio: {service?.id}</DialogTitle>
          <DialogDescription>
            Apporta modifiche ai dettagli del servizio.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo Servizio</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormItem>
              <FormLabel>Cliente</FormLabel>
              <Input value={service?.clienti?.nome_cliente || 'N/A'} disabled />
            </FormItem>
            <FormItem>
              <FormLabel>Punto Servizio</FormLabel>
              <Input value={service?.punti_servizio?.nome_punto_servizio || 'N/A'} disabled />
            </FormItem>
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stato</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona stato" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Approved">Approved</SelectItem>
                      <SelectItem value="Rejected">Rejected</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">Salva Modifiche</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}