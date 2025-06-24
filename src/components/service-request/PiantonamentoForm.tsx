import React, { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, parseISO, isValid, addDays, isWeekend, isHoliday } from "date-fns";
import { it } from 'date-fns/locale'; // Import Italian locale
import { CalendarIcon, PlusCircle, MinusCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

// Define a list of holidays (example, you might want a more robust solution)
const italianHolidays = [
  new Date(2024, 0, 1), // Capodanno
  new Date(2024, 0, 6), // Epifania
  new Date(2024, 3, 1), // Pasquetta (example for 2024)
  new Date(2024, 3, 25), // Festa della Liberazione
  new Date(2024, 4, 1), // Festa dei Lavoratori
  new Date(2024, 5, 2), // Festa della Repubblica
  new Date(2024, 7, 15), // Ferragosto
  new Date(2024, 10, 1), // Ognissanti
  new Date(2024, 11, 8), // Immacolata Concezione
  new Date(2024, 11, 25), // Natale
  new Date(2024, 11, 26), // Santo Stefano
];

const isDateHoliday = (date: Date) => {
  return italianHolidays.some(holiday => format(holiday, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd'));
};

const dailyHoursSchema = z.object({
  day: z.string(),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato ora non valido (HH:MM).").or(z.literal("")),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato ora non valido (HH:MM).").or(z.literal("")),
  is24h: z.boolean().default(false),
}).refine(data => data.is24h || (data.startTime !== "" && data.endTime !== ""), {
  message: "Inserisci orari o seleziona H24.",
  path: ["startTime"],
}).refine(data => data.is24h || (data.startTime !== "" && data.endTime !== ""), {
  message: "Inserisci orari o seleziona H24.",
  path: ["endTime"],
});

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
  dailyHours: z.array(dailyHoursSchema).min(8, "Definisci gli orari per tutti i giorni e i festivi."),
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

export function PiantonamentoForm() {
  const [calculatedHours, setCalculatedHours] = useState<number | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      startTime: "09:00",
      endTime: "17:00",
      numAgents: 1,
      dailyHours: [
        { day: "Lunedì", startTime: "09:00", endTime: "17:00", is24h: false },
        { day: "Martedì", startTime: "09:00", endTime: "17:00", is24h: false },
        { day: "Mercoledì", startTime: "09:00", endTime: "17:00", is24h: false },
        { day: "Giovedì", startTime: "09:00", endTime: "17:00", is24h: false },
        { day: "Venerdì", startTime: "09:00", endTime: "17:00", is24h: false },
        { day: "Sabato", startTime: "09:00", endTime: "13:00", is24h: false },
        { day: "Domenica", startTime: "", endTime: "", is24h: true },
        { day: "Festivi", startTime: "", endTime: "", is24h: true },
      ],
    },
  });

  const { fields } = useFieldArray({
    control: form.control,
    name: "dailyHours",
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const start = values.startDate;
    const end = values.endDate;
    const numAgents = values.numAgents;
    const dailyHoursConfig = values.dailyHours;

    let totalHours = 0;
    let currentDate = new Date(start);

    while (currentDate <= end) {
      const dayOfWeek = format(currentDate, 'EEEE', { locale: it }); // e.g., "lunedì"
      const isCurrentDayHoliday = isDateHoliday(currentDate);
      const isCurrentDayWeekend = isWeekend(currentDate);

      let dayConfig;
      if (isCurrentDayHoliday) {
        dayConfig = dailyHoursConfig.find(d => d.day === "Festivi");
      } else if (dayOfWeek === "sabato") {
        dayConfig = dailyHoursConfig.find(d => d.day === "Sabato");
      } else if (dayOfWeek === "domenica") {
        dayConfig = dailyHoursConfig.find(d => d.day === "Domenica");
      } else {
        dayConfig = dailyHoursConfig.find(d => d.day === dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1));
      }

      if (dayConfig) {
        if (dayConfig.is24h) {
          totalHours += 24;
        } else if (dayConfig.startTime && dayConfig.endTime) {
          const startOfDay = parseISO(format(currentDate, 'yyyy-MM-dd') + 'T' + dayConfig.startTime + ':00');
          const endOfDay = parseISO(format(currentDate, 'yyyy-MM-dd') + 'T' + dayConfig.endTime + ':00');
          
          if (isValid(startOfDay) && isValid(endOfDay)) {
            let dailyDiffMs = endOfDay.getTime() - startOfDay.getTime();
            if (dailyDiffMs < 0) { // Handle overnight shifts
              dailyDiffMs += 24 * 60 * 60 * 1000;
            }
            totalHours += dailyDiffMs / (1000 * 60 * 60);
          }
        }
      }
      currentDate = addDays(currentDate, 1);
    }

    // Adjust for partial first/last day if needed (this is the complex part)
    // For now, the calculation is simplified to sum daily hours.
    // A more precise calculation would involve intersecting the service period
    // with the daily configured hours.

    const finalCalculatedHours = totalHours * numAgents;
    setCalculatedHours(finalCalculatedHours);
    console.log("Calculated Hours (simplified):", finalCalculatedHours);
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
          name="numAgents"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Numero di agenti richiesti</FormLabel>
              <FormControl>
                <Input type="number" {...field} onChange={e => field.onChange(e.target.valueAsNumber)} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Separator className="my-8" />

        <h3 className="text-lg font-semibold mb-4">Orari giornalieri specifici</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Definisci gli orari di servizio per ogni giorno della settimana e per i giorni festivi.
          Seleziona "H24" per un servizio continuo di 24 ore.
        </p>

        <div className="space-y-4">
          {fields.map((item, index) => (
            <div key={item.id} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center p-4 border rounded-md">
              <Label className="col-span-1 font-medium">{item.day}</Label>
              <FormField
                control={form.control}
                name={`dailyHours.${index}.startTime`}
                render={({ field }) => (
                  <FormItem className="col-span-1">
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="HH:MM"
                        {...field}
                        disabled={form.watch(`dailyHours.${index}.is24h`)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <span className="text-center">-</span>
              <FormField
                control={form.control}
                name={`dailyHours.${index}.endTime`}
                render={({ field }) => (
                  <FormItem className="col-span-1">
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="HH:MM"
                        {...field}
                        disabled={form.watch(`dailyHours.${index}.is24h`)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`dailyHours.${index}.is24h`}
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-2 space-y-0 col-span-1">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          field.onChange(checked);
                          if (checked) {
                            form.setValue(`dailyHours.${index}.startTime`, "");
                            form.setValue(`dailyHours.${index}.endTime`, "");
                          }
                        }}
                      />
                    </FormControl>
                    <FormLabel className="!mt-0">H24</FormLabel>
                  </FormItem>
                )}
              />
            </div>
          ))}
        </div>

        <Button type="submit" className="w-full">Calcola Ore</Button>
        {calculatedHours !== null && (
          <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-md text-center">
            <h3 className="text-lg font-semibold">Ore Totali Calcolate:</h3>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{calculatedHours.toFixed(2)} ore</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              (Questo calcolo somma le ore configurate per ogni giorno nel periodo selezionato, moltiplicate per il numero di agenti. Non considera ancora l'intersezione precisa con gli orari di inizio/fine servizio complessivi o turni notturni complessi.)
            </p>
          </div>
        )}
      </form>
    </Form>
  );
}