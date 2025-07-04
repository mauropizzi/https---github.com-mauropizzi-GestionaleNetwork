import React from "react";
import { useFormContext } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Clock } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Personale, PuntoServizio } from "@/lib/anagrafiche-data";

interface ReportDetailsSectionProps {
  personaleList: Personale[];
  puntiServizioList: PuntoServizio[];
  isEmployeeSelectOpen: boolean;
  setIsEmployeeSelectOpen: (isOpen: boolean) => void;
  isServicePointSelectOpen: boolean;
  setIsServicePointSelectOpen: (isOpen: boolean) => void;
  handleSetCurrentTime: (field: "startTime" | "endTime") => void;
}

export function ReportDetailsSection({
  personaleList,
  puntiServizioList,
  isEmployeeSelectOpen,
  setIsEmployeeSelectOpen,
  isServicePointSelectOpen,
  setIsServicePointSelectOpen,
  handleSetCurrentTime,
}: ReportDetailsSectionProps) {
  const { control, register, formState: { errors } } = useFormContext();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Service Date */}
      <FormField
        control={control}
        name="serviceDate"
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel>Data Servizio</FormLabel>
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
                  disabled={(date) =>
                    date > new Date() || date < new Date("1900-01-01")
                  }
                  initialFocus
                  locale={it}
                />
              </PopoverContent>
            </Popover>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Employee ID */}
      <FormField
        control={control}
        name="employeeId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Dipendente</FormLabel>
            <Select
              onValueChange={field.onChange}
              value={field.value}
              onOpenChange={setIsEmployeeSelectOpen}
              open={isEmployeeSelectOpen}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona un dipendente" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {personaleList.map((personale) => (
                  <SelectItem key={personale.id} value={personale.id}>
                    {personale.nome} {personale.cognome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Service Point ID */}
      <FormField
        control={control}
        name="servicePointId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Punto Servizio</FormLabel>
            <Select
              onValueChange={field.onChange}
              value={field.value}
              onOpenChange={setIsServicePointSelectOpen}
              open={isServicePointSelectOpen}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona un punto servizio" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {puntiServizioList.map((punto) => (
                  <SelectItem key={punto.id} value={punto.id}>
                    {punto.nome_punto_servizio}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Service Type */}
      <FormField
        control={control}
        name="serviceType"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Tipo Servizio</FormLabel>
            <FormControl>
              <Input placeholder="Es. Pattugliamento, Ispezione" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Start Time */}
      <FormField
        control={control}
        name="startTime"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Orario Inizio</FormLabel>
            <div className="flex items-center space-x-2">
              <FormControl>
                <Input type="time" {...field} />
              </FormControl>
              <Button type="button" variant="outline" size="icon" onClick={() => handleSetCurrentTime("startTime")}>
                <Clock className="h-4 w-4" />
              </Button>
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* End Time */}
      <FormField
        control={control}
        name="endTime"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Orario Fine</FormLabel>
            <div className="flex items-center space-x-2">
              <FormControl>
                <Input type="time" {...field} />
              </FormControl>
              <Button type="button" variant="outline" size="icon" onClick={() => handleSetCurrentTime("endTime")}>
                <Clock className="h-4 w-4" />
              </Button>
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}