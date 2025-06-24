import React, { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, parseISO, isValid, addDays, isWeekend } from "date-fns";
import { it } from 'date-fns/locale';
import { CalendarIcon } from "lucide-react";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { isDateHoliday } from "@/lib/date-utils";

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
    required_error: "La data di inizio servizio è richiesta.",
  }),
  endDate: z.date({
    required_error: "La data di fine servizio è richiesta.",
  }),
  cadenceHours: z.coerce.number().min(0.5, "La cadenza deve essere di almeno 0.5 ore.").max(24, "La cadenza non può superare le 24 ore."),
  inspectionType: z.enum(["perimetrale", "interna", "completa"], {
    required_error: "Seleziona un tipo di ispezione.",
  }),
  dailyHours: z.array(dailyHoursSchema).min(8, "Definisci gli orari per tutti i giorni e i festivi."),
}).refine(data => {
  return data.endDate.getTime() >= data.startDate.getTime();
}, {
  message: "La data di fine non può essere precedente alla data di inizio.",
  path: ["endDate"],
});

export function IspezioniForm() {
  const [calculatedInspections, setCalculatedInspections] = useState<number | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cadenceHours: 2,
      inspectionType: "perimetrale",
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
    const cadenceHours = values.cadenceHours;
    const dailyHoursConfig = values.dailyHours;

    let totalOperationalHours = 0;
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
          totalOperationalHours += 24;
        } else if (dayConfig.startTime && dayConfig.endTime) {
          const startOfDay = parseISO(format(currentDate, 'yyyy-MM-dd') + 'T' + dayConfig.startTime + ':00');
          const endOfDay = parseISO(format(currentDate, 'yyyy-MM-dd') + 'T' + dayConfig.endTime + ':00');
          
          if (isValid(startOfDay) && isValid(endOfDay)) {
            let dailyDiffMs = endOfDay.getTime() - startOfDay.getTime();
            if (dailyDiffMs < 0) { // Handle overnight shifts
              dailyDiffMs += 24 * 60 * 60 * 1000;
            }
            totalOperationalHours += dailyDiffMs / (1000 * 60 * 60);
          }
        }
      }
      currentDate = addDays(currentDate, 1);
    }

    if (cadenceHours <= 0) {
      setCalculatedInspections(0);
      return;
    }

    // Calculation: (Total operational hours over the period) / Cadenza + 1 (for the initial inspection)
    const numInspections = Math.floor(totalOperationalHours / cadenceHours) + 1;
    setCalculatedInspections(numInspections);
    console.log("Calculated Inspections:", numInspections);
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