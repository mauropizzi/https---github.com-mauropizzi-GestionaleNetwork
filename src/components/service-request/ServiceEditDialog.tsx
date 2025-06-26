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
  client: string;
  location: string;
  startDate: Date;
  endDate: Date;
  status: "Pending" | "Approved" | "Rejected" | "Completed";
  cost?: number;
}

interface ServiceEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  service: ServiceRequest | null;
  onSave: (updatedService: ServiceRequest) => void;
}

const formSchema = z.object({
  type: z.string().min(1, "Il tipo di servizio è richiesto."),
  client: z.string().min(1, "Il cliente è richiesto."),
  location: z.string().min(1, "La località è richiesta."),
  status: z.enum(["Pending", "Approved", "Rejected", "Completed"], {
    required_error: "Lo stato è richiesto.",
  }),
  cost: z.coerce.number().optional(),
});

export function ServiceEditDialog({ isOpen, onClose, service, onSave }: ServiceEditDialogProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: service || {
      type: "",
      client: "",
      location: "",
      status: "Pending",
      cost: 0,
    },
  });

  React.useEffect(() => {
    if (service) {
      form.reset(service);
    }
  }, [service, form]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (service) {
      const updatedService: ServiceRequest = {
        ...service,
        ...values,
        cost: values.cost !== undefined ? values.cost : undefined,
      };
      onSave(updatedService);
      showSuccess(`Servizio ${updatedService.id} aggiornato con successo!`);
      onClose();
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
                    <Input {...field} />
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
                  <FormLabel>Località</FormLabel>
                  <FormControl>
                    <Input {...field} />
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
            <FormField
              control={form.control}
              name="cost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Costo Stimato (€)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} onChange={e => field.onChange(e.target.valueAsNumber)} />
                  </FormControl>
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