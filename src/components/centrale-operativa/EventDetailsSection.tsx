import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { PuntoServizio, Personale } from '@/lib/anagrafiche-data';
import { requestTypeOptions } from '@/lib/centrale-options';
import { useFormContext } from 'react-hook-form';
import { FormField, FormItem, FormControl, FormMessage, FormLabel } from '@/components/ui/form'; // Added FormLabel
import { Label } from '@/components/ui/label'; // Keep generic Label for non-form elements

interface EventDetailsSectionProps {
  handleSetCurrentTime: (field: string) => void;
  handleStartGpsTracking: () => void;
  puntiServizioList: PuntoServizio[];
  coOperatorsPersonnel: Personale[];
  isServicePointOpen: boolean;
  setIsServicePointOpen: (open: boolean) => void;
  isCoOperatorOpen: boolean;
  setIsCoOperatorOpen: (open: boolean) => void;
}

export const EventDetailsSection: React.FC<EventDetailsSectionProps> = ({
  handleSetCurrentTime,
  handleStartGpsTracking,
  puntiServizioList,
  coOperatorsPersonnel,
  isServicePointOpen,
  setIsServicePointOpen,
  isCoOperatorOpen,
  setIsCoOperatorOpen,
}) => {
  const { control, watch, setValue } = useFormContext(); // Get form methods from context

  const formData = watch(); // Watch all form data
  const selectedServicePoint = puntiServizioList.find(p => p.id === formData.servicePoint);

  return (
    <section className="space-y-4">
      <FormField
        control={control}
        name="servicePoint"
        render={({ field }) => (
          <FormItem className="space-y-2">
            <FormLabel>Punto Servizio *</FormLabel>
            <Popover open={isServicePointOpen} onOpenChange={setIsServicePointOpen}>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={isServicePointOpen}
                    className="w-full justify-between"
                  >
                    {field.value
                      ? puntiServizioList.find(point => point.id === field.value)?.nome_punto_servizio
                      : "Seleziona un punto servizio..."}
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
                          field.onChange(point.id);
                          setIsServicePointOpen(false);
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

      <div className="space-y-2">
        <Label>Intervento da effettuarsi ENTRO:</Label>
        <div className="p-2 border rounded-md">
          {selectedServicePoint?.tempo_intervento !== undefined && selectedServicePoint?.tempo_intervento !== null ? 
            `${selectedServicePoint.tempo_intervento} minuti` : 
            "N/A"}
        </div>
      </div>

      <FormField
        control={control}
        name="requestType"
        render={({ field }) => (
          <FormItem className="space-y-2">
            <FormLabel>Tipologia Servizio Richiesto *</FormLabel>
            <Select
              onValueChange={field.onChange}
              value={field.value}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona Tipologia Servizio..." />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {requestTypeOptions.map(option => (
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

      <FormField
        control={control}
        name="coOperator"
        render={({ field }) => (
          <FormItem className="space-y-2">
            <FormLabel>Operatore C.O. Security Service *</FormLabel>
            <Popover open={isCoOperatorOpen} onOpenChange={setIsCoOperatorOpen}>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={isCoOperatorOpen}
                    className="w-full justify-between"
                  >
                    {field.value
                      ? coOperatorsPersonnel.find(op => op.id === field.value)?.nome + " " + coOperatorsPersonnel.find(op => op.id === field.value)?.cognome
                      : "Seleziona operatore C.O...."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                  <CommandInput placeholder="Cerca operatore C.O...." />
                  <CommandEmpty>Nessun operatore C.O. trovato.</CommandEmpty>
                  <CommandGroup>
                    {coOperatorsPersonnel.map((op) => (
                      <CommandItem
                        key={op.id}
                        value={`${op.nome} ${op.cognome || ''}`}
                        onSelect={() => {
                          field.onChange(op.id);
                          setIsCoOperatorOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            field.value === op.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {op.nome} {op.cognome}
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
        name="requestTime"
        render={({ field }) => (
          <FormItem className="space-y-2">
            <FormLabel>Orario Richiesta C.O. Security Service *</FormLabel>
            <div className="flex gap-2">
              <FormControl>
                <Input
                  type="datetime-local"
                  id="request-time"
                  {...field}
                  className="flex-1"
                  readOnly
                />
              </FormControl>
            </div>
            <Button 
              type="button" 
              className="w-full bg-blue-600 hover:bg-blue-700" 
              onClick={handleStartGpsTracking}
            >
              Posizione GPS presa in carico Richiesta
            </Button>
            {formData.startLatitude !== undefined && formData.startLongitude !== undefined && (
              <p className="text-sm text-gray-500 mt-1 text-center">
                Latitudine: {formData.startLatitude?.toFixed(6)}, Longitudine: {formData.startLongitude?.toFixed(6)}
              </p>
            )}
            <FormMessage />
          </FormItem>
        )}
      />
    </section>
  );
};