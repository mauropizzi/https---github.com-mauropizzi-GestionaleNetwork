import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { PuntoServizio, Personale } from '@/lib/anagrafiche-data';
import { requestTypeOptions } from '@/lib/centrale-options';

interface EventDetailsSectionProps {
  formData: any;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSelectChange: (name: string, value: string) => void;
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
  formData,
  handleInputChange,
  handleSelectChange,
  handleSetCurrentTime,
  handleStartGpsTracking,
  puntiServizioList,
  coOperatorsPersonnel,
  isServicePointOpen,
  setIsServicePointOpen,
  isCoOperatorOpen,
  setIsCoOperatorOpen,
}) => {
  const selectedServicePoint = puntiServizioList.find(p => p.id === formData.servicePoint);

  return (
    <section className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="service-point">Punto Servizio *</Label>
        <Popover open={isServicePointOpen} onOpenChange={setIsServicePointOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={isServicePointOpen}
              className="w-full justify-between"
            >
              {formData.servicePoint
                ? puntiServizioList.find(point => point.id === formData.servicePoint)?.nome_punto_servizio
                : "Seleziona un punto servizio..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
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
                      handleSelectChange('servicePoint', point.id);
                      setIsServicePointOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        formData.servicePoint === point.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {point.nome_punto_servizio}
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <Label>Intervento da effettuarsi ENTRO:</Label>
        <div className="p-2 border rounded-md">
          {selectedServicePoint?.tempo_intervento !== undefined && selectedServicePoint?.tempo_intervento !== null ? 
            `${selectedServicePoint.tempo_intervento} minuti` : 
            "N/A"}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="request-type">Tipologia Servizio Richiesto *</Label>
        <Select
          onValueChange={(value) => handleSelectChange('requestType', value)}
          value={formData.requestType}
        >
          <SelectTrigger>
            <SelectValue placeholder="Seleziona Tipologia Servizio..." />
          </SelectTrigger>
          <SelectContent>
            {requestTypeOptions.map(option => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="co-operator">Operatore C.O. Security Service</Label>
        <Popover open={isCoOperatorOpen} onOpenChange={setIsCoOperatorOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={isCoOperatorOpen}
              className="w-full justify-between"
            >
              {formData.coOperator
                ? coOperatorsPersonnel.find(op => op.id === formData.coOperator)?.nome + " " + coOperatorsPersonnel.find(op => op.id === formData.coOperator)?.cognome
                : "Seleziona operatore C.O...."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
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
                      handleSelectChange('coOperator', op.id);
                      setIsCoOperatorOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        formData.coOperator === op.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {op.nome} {op.cognome}
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <Label htmlFor="request-time">Orario Richiesta C.O. Security Service *</Label>
        <div className="flex gap-2">
          <Input
            type="datetime-local"
            id="request-time"
            name="requestTime"
            value={formData.requestTime}
            onChange={handleInputChange}
            className="flex-1"
          />
          <Button 
            type="button" 
            variant="outline"
            onClick={() => handleSetCurrentTime('requestTime')}
          >
            Ora Attuale
          </Button>
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
      </div>
    </section>
  );
};