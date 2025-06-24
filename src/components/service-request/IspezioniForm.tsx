import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, parseISO, isValid, addDays } from "date-fns";
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
  serviceDate: z.date({
    required_error: "La data di inizio servizio è richiesta.",
  }),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato ora inizio non valido (HH:MM)."),
  endDate: z.date({ // New field for end date
    required_error: "La data di fine servizio è richiesta.",
  }),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato ora fine non valido (HH:MM)."),
  cadenceHours: z.coerce.number().min(0.5, "La cadenza deve essere di almeno 0.5 ore.").max(24, "La cadenza non può superare le 24 ore."),
  inspectionType: z.enum(["perimetrale", "interna", "completa"], {
    required_error: "Seleziona un tipo di ispezione.",
  }),
}).refine(data => {
  const startDateTimeStr = `${format(data.serviceDate, "yyyy-MM-dd")}T${data.startTime}:00`;
  const endDateTimeStr = `${format(data.endDate, "yyyy-MM-dd")}T${data.endTime}:00`;
  const start = parseISO(startDateTimeStr);
  const end = parseISO(endDateTimeStr);
  return isValid(start) && isValid(end) && end.getTime() >= start.getTime();
}, {
  message: "La data/ora di fine non può essere precedente alla data/ora di inizio.",
  path: ["endDate"],
});

export function IspezioniForm() {
  const [calculatedInspections, setCalculatedInspections] = useState<number | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      startTime: "09:00",
      endTime: "17:00",
      cadenceHours: 2,
      inspectionType: "perimetrale",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const start = values.serviceDate;
    const end = values.endDate; // Use endDate
    const dailyStartTime = values.startTime;
    const dailyEndTime = values.endTime;

    let totalOperationalHours = 0;
    let currentDate = new Date(start);

    while (currentDate <= end) {
      const startOfDay = parseISO(format(currentDate, 'yyyy-MM-dd') + 'T' + dailyStartTime + ':00');
      const endOfDay = parseISO(format(currentDate, 'yyyy-MM-dd') + 'T' + dailyEndTime + ':00');
      
      if (isValid(startOfDay) && isValid(endOfDay)) {
        let dailyDiffMs = endOfDay.getTime() - startOfDay.getTime();
        if (dailyDiffMs < 0) { // Handle overnight shifts if end time is on the next day
          dailyDiffMs += 24 * 60 * 60 * 1000;
        }
        totalOperationalHours += dailyDiffMs / (1000 * 60 * 60);
      }
      currentDate = addDays(currentDate, 1);
    }

    if (values.cadenceHours <= 0) {
      setCalculatedInspections(0);
      return;
    }

    // Calculation: (Total operational hours over the period) / Cadenza + 1 (for the initial inspection)
    const numInspections = Math.floor(totalOperationalHours / values.cadenceHours) + 1;
    setCalculatedInspections(numInspections);
    console.log("Calculated Inspections:", numInspections);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="serviceDate"
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
                <FormLabel>Ora inizio fascia (HH:MM)</FormLabel>
                <FormControl>
                  <Input type="text" placeholder="09:00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="endDate" // New FormField for end date
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
                <FormLabel>Ora fine fascia (HH:MM)</FormLabel>
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
          name="cadenceHours"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cadenza oraria per ispezioni (ore)</FormLabel>
              <FormControl>
                <Input type="number" step="0.5" placeholder="2" {...field} onChange={e => field.onChange(e.target.valueAsNumber)} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="inspectionType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo di ispezione</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona un tipo di ispezione" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="perimetrale">Perimetrale</SelectItem>
                  <SelectItem value="interna">Interna</SelectItem>
                  <SelectItem value="completa">Completa</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">Calcola Ispezioni</Button>
        {calculatedInspections !== null && (
          <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-md text-center">
            <h3 className="text-lg font-semibold">Numero di Ispezioni Calcolate:</h3>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{calculatedInspections}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              (Questo calcolo considera le ore operative totali tra la data di inizio e la data di fine, divise per la cadenza, più un'ispezione iniziale.)
            </p>
          </div>
        )}
      </form>
    </Form>
  );
}