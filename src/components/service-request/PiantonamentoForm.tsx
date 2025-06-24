import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, parseISO, isValid } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  startDate: z.date({
    required_error: "La data di inizio è richiesta.",
  }),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato ora non valido (HH:MM)."),
  endDate: z.date({
    required_error: "La data di fine è richiesta.",
  }),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato ora non valido (HH:MM)."),
  numAgents: z.coerce.number().min(1, "Il numero di agenti deve essere almeno 1."),
});

export function PiantonamentoForm() {
  const [calculatedHours, setCalculatedHours] = useState<number | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      startTime: "09:00",
      endTime: "17:00",
      numAgents: 1,
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const startDateTimeStr = `${format(values.startDate, "yyyy-MM-dd")}T${values.startTime}:00`;
    const endDateTimeStr = `${format(values.endDate, "yyyy-MM-dd")}T${values.endTime}:00`;

    const start = parseISO(startDateTimeStr);
    const end = parseISO(endDateTimeStr);

    if (!isValid(start) || !isValid(end)) {
      console.error("Invalid date or time input.");
      return;
    }

    const diffMs = end.getTime() - start.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 0) {
      form.setError("endDate", { message: "La data/ora di fine non può essere precedente alla data/ora di inizio." });
      form.setError("endTime", { message: "La data/ora di fine non può essere precedente alla data/ora di inizio." });
      setCalculatedHours(null);
      return;
    }

    // For simplicity, this initial calculation assumes continuous service.
    // The daily hour logic will be added later.
    const totalCalculatedHours = diffHours * values.numAgents;
    setCalculatedHours(totalCalculatedHours);
    console.log("Calculated Hours:", totalCalculatedHours);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data di inizio servizio</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Seleziona una data</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="startTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ora di inizio servizio (HH:MM)</FormLabel>
                <FormControl>
                  <Input type="text" placeholder="HH:MM" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data di fine servizio</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Seleziona una data</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="endTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ora di fine servizio (HH:MM)</FormLabel>
                <FormControl>
                  <Input type="text" placeholder="HH:MM" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="numAgents"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Numero di agenti richiesti</FormLabel>
              <FormControl>
                <Input type="number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">Calcola Ore</Button>
        {calculatedHours !== null && (
          <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-md text-center">
            <h3 className="text-lg font-semibold">Ore Totali Calcolate:</h3>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{calculatedHours.toFixed(2)} ore</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              (Questo calcolo assume un servizio continuo tra le date/ore specificate. La logica per orari giornalieri specifici verrà aggiunta in seguito.)
            </p>
          </div>
        )}
      </form>
    </Form>
  );
}