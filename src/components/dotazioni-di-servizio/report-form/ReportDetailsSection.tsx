import React from "react";
import { useFormContext } from "react-hook-form";
import { format, parseISO, isValid } from "date-fns";
import { it } from 'date-fns/locale';
import { CalendarIcon, Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
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
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Personale, PuntoServizio } from "@/lib/anagrafiche-data";
import { serviceTypeOptions } from "@/lib/dotazioni-data";

interface ReportDetailsSectionProps {
  personaleList: Personale[];
  puntiServizioList: PuntoServizio[];
  isEmployeeSelectOpen: boolean;
  setIsEmployeeSelectOpen: (open: boolean) => void;
  isServicePointSelectOpen: boolean;
  setIsServicePointSelectOpen: (open: boolean) => void;
  handleSetCurrentTime: (field: "startTime" | "endTime") => void;
}

export const ReportDetailsSection: React.FC<ReportDetailsSectionProps> = ({
  personaleList,
  puntiServizioList,
  isEmployeeSelectOpen,
  setIsEmployeeSelectOpen,
  isServicePointSelectOpen,
  setIsServicePointSelectOpen,
  handleSetCurrentTime,
}) => {
  const { control, setValue } = useFormContext();

  const handleSetCurrentDate = () => {
    setValue("serviceDate", new Date());
  };

  return (
    <section className="p-4 border rounded-lg shadow-sm bg-card">
      <h3 className="text-lg font-semibold mb-4">Dettagli Rapporto</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          control={control}
          name="employeeId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dipendente</FormLabel>
              <Popover open={isEmployeeSelectOpen} onOpenChange={setIsEmployeeSelectOpen}>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={isEmployeeSelectOpen}
                      className="w-full justify-between"
                    >
                      {field.value
                        ? personaleList.find(
                            (personale) => personale.id === field.value
                          )?.nome + " " + personaleList.find(
                            (personale) => personale.id === field.value
                          )?.cognome
                        : "Seleziona un dipendente"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command>
                    <CommandInput placeholder="Cerca dipendente..." />
                    <CommandEmpty>Nessun dipendente trovato.</CommandEmpty>
                    <CommandGroup>
                      {personaleList.map((personale) => (
                        <CommandItem
                          key={personale.id}
                          value={`${personale.nome} ${personale.cognome}`}
                          onSelect={() => {
                            setValue("employeeId", personale.id);
                            setIsEmployeeSelectOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              field.value === personale.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {personale.nome} {personale.cognome} ({personale.ruolo})
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <FormField
          control={control}
          name="servicePointId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Punto Servizio</FormLabel>
              <Popover open={isServicePointSelectOpen} onOpenChange={setIsServicePointSelectOpen}>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={isServicePointSelectOpen}
                      className="w-full justify-between"
                    >
                      {field.value
                        ? puntiServizioList.find(
                            (point) => point.id === field.value
                          )?.nome_punto_servizio
                        : "Seleziona un punto servizio"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command>
                    <CommandInput placeholder="Cerca punto servizio..." />
                    <CommandEmpty>Nessun punto servizio trovato.</CommandEmpty>
                    <CommandGroup>
                      {puntiServizioList.map((point) => (
                        <CommandItem
                          key={point.id}
                          value={point.nome_punto_servizio}
                          onSelect={() => {
                            setValue("servicePointId", point.id);
                            setIsServicePointSelectOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              field.value === point.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {point.nome_punto_servizio}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="serviceType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo Servizio</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona tipo servizio" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {serviceTypeOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <FormField
          control={control}
          name="startTime"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Orario Inizio</FormLabel>
              <div className="flex gap-2">
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <Button type="button" variant="outline" onClick={() => handleSetCurrentTime('startTime')}>
                  Ora Attuale
                </Button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="endTime"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Orario Fine</FormLabel>
              <div className="flex gap-2">
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <Button type="button" variant="outline" onClick={() => handleSetCurrentTime('endTime')}>
                  Ora Attuale
                </Button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </section>
  );
};