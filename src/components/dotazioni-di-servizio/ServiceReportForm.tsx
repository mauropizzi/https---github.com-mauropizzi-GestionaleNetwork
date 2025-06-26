import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  serviceLocationOptions,
  serviceTypeOptions,
  vehicleMakeModelOptions,
  vehiclePlateOptions,
  vehicleInitialStateOptions,
  bodyworkDamageOptions,
  employeeNameOptions,
} from "@/lib/dotazioni-data";

// Definizione dello schema
const formSchema = z.object({
  serviceDate: z.string().min(1, "La data è obbligatoria"),
  employeeId: z.string().min(1, "L'addetto è obbligatorio"),
  serviceLocation: z.string().min(1, "La località è obbligatoria"),
  serviceType: z.string().min(1, "Il tipo di servizio è obbligatorio"),
  vehicleMakeModel: z.string().min(1, "Il modello è obbligatorio"),
  vehiclePlate: z.string().min(1, "La targa è obbligatoria"),
  vehicleInitialState: z.string().min(1, "Lo stato iniziale è obbligatorio"),
  bodyworkDamage: z.string().optional(),
  vehicleAnomalies: z.string().optional(),
  gps: z.enum(["SI", "NO"], { required_error: "Selezionare SI o NO" }),
  radioVehicle: z.enum(["SI", "NO"], { required_error: "Selezionare SI o NO" }),
  swivelingLamp: z.enum(["SI", "NO"], { required_error: "Selezionare SI o NO" }),
  radioPortable: z.enum(["SI", "NO"], { required_error: "Selezionare SI o NO" }),
  flashlight: z.enum(["SI", "NO"], { required_error: "Selezionare SI o NO" }),
  extinguisher: z.enum(["SI", "NO"], { required_error: "Selezionare SI o NO" }),
  spareTire: z.enum(["SI", "NO"], { required_error: "Selezionare SI o NO" }),
  highVisibilityVest: z.enum(["SI", "NO"], { required_error: "Selezionare SI o NO" }),
});

// Definizione del componente
const ServiceReportForm = () => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
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

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    console.log(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Tutti i campi del form qui... */}
        
        <Button type="submit" className="w-full">
          Invia Rapporto
        </Button>
      </form>
    </Form>
  );
};

// Export del componente
export default ServiceReportForm;