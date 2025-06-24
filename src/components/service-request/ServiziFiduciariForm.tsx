import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, parseISO, isValid } from "date-fns";
import { it } from 'date-fns/locale';
import { CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  serviceType: z.enum(["reception", "controllo_accessi", "altro"], {
    required_error: "Seleziona un tipo di servizio fiduciario.",
  }),
  numOperators: z.coerce.number().min(1, "Il numero di operatori deve essere almeno 1."),
}).refine(data => {
  const startDateTimeStr = `${format(data.startDate, "yyyy-MM-dd")}T${data.startTime}:00`;
  const endDateTimeStr = `${format(data.endDate, "yyyy-MM-dd")}T${data.endTime}:00`;
  const start = parseISO(startDateTimeStr);
  const end = parseISO(endDateTimeStr);
  return isValid(start) && isValid(end) && end.getTime() >= start.getTime();
}, {
  message: "La data/ora di fine non può essere precedente alla data/ora di inizio.",
  path: ["endDate"],
});

export function ServiziFiduciariForm() {
  const [calculatedHours, setCalculatedHours] = useState<number | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      startTime: "09:00",
      endTime: "17:00",
      serviceType: "reception",
      numOperators: 1,
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const startDateTimeStr = `${format(values.startDate, "yyyy-MM-dd")}T${values.startTime}:00`;
    const endDateTimeStr = `${format(values.endDate, "yyyy-MM-dd")}T${values.endTime}:00`;

    const start = parseISO(startDateTimeStr);
    const end = parseISO(endDateTimeStr);

    const diffMs = end.getTime() - start.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    const totalCalculatedHours = diffHours * values.numOperators;
    setCalculatedHours(totalCalculatedHours);
    console.log("Calculated Fiduciari Hours:", totalCalculatedHours);
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
                          format(field.value, "PPP", { locale: it })
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
                      locale={it}
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
                  <Input type="text" placeholder="09:00" {...field} />
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
                          format(field.value, "PPP", { locale: it })
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
                      locale={it}
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
                  <Input type="text" placeholder="17:00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="serviceType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo di servizio fiduciario</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona un tipo di servizio" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="reception">Reception</SelectItem>
                  <SelectItem value="controllo_accessi">Controllo Accessi</SelectItem>
                  <SelectItem value="altro">Altro</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="numOperators"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Numero di operatori richiesti</FormLabel>
              <FormControl>
                <Input type="number" {...field} onChange={e => field.onChange(e.target.valueAsNumber)} />
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
          </div>
        )}
      </form>
    </Form>
  );
}