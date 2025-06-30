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

interface ServiceRequest {
  id: string;
  type: string;
  client: string; // Display name
  location: string; // Display name
  startDate: Date;
  endDate: Date;
  status: "Pending" | "Approved" | "Rejected" | "Completed";
  cost?: number; // Keep optional for display, but not editable via form
  // Add other fields if you want to make them editable
  startTime?: string;
  endTime?: string;
  numAgents?: number;
  cadenceHours?: number;
  inspectionType?: string;
  dailyHoursConfig?: any;
}

interface ServiceEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  service: ServiceRequest | null;
  onSave: (updatedService: ServiceRequest) => void;
}

const formSchema = z.object({
  type: z.string().min(1, "Il tipo di servizio è richiesto."),
  client: z.string().min(1, "Il cliente è richiesto."), // This will be a display name, not ID
  location: z.string().min(1, "La località è richiesta."), // This will be a display name, not ID
  status: z.enum(["Pending", "Approved", "Rejected", "Completed"], {
    required_error: "Lo stato è richiesto.",
  }),
  // Rimosso cost: z.coerce.number().optional(),
  // Add other fields here if they need to be editable
});

export function ServiceEditDialog({ isOpen, onClose, service, onSave }: ServiceEditDialogProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: service ? {
      type: service.type,
      client: service.client,
      location: service.location,
      status: service.status,
      // Rimosso cost: service.cost,
    } : {
      type: "",
      client: "",
      location: "",
      status: "Pending",
      // Rimosso cost: 0,
    },
  });

  React.useEffect(() => {
    if (service) {
      form.reset({
        type: service.type,
        client: service.client,
        location: service.location,
        status: service.status,
        // Rimosso cost: service.cost,
      });
    }
  }, [service, form]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (service) {
      const updatedService: ServiceRequest = {
        ...service,
        ...values,
        // Rimosso cost: values.cost !== undefined ? values.cost : undefined,
      };
      onSave(updatedService); // Pass the updated service back to the parent
      // showSuccess(`Servizio ${updatedService.id} aggiornato con successo!`); // Handled by parent
      // onClose(); // Handled by parent
    } else {
      showError("Nessun servizio selezionato per la modifica.");
    }
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
            <FormField
              control={form.control}
              name="client"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cliente</FormLabel>
                  <FormControl>
                    <Input {...field} disabled /> {/* Client name is display-only */}
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Punto Servizio</FormLabel>
                  <FormControl>
                    <Input {...field} disabled /> {/* Location name is display-only */}
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
            {/* Rimosso FormField per il costo */}
            <DialogFooter>
              <Button type="submit">Salva Modifiche</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}