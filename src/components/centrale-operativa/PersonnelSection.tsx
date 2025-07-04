import React from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Personale, OperatoreNetwork } from '@/lib/anagrafiche-data';
import { useFormContext } from 'react-hook-form'; // Import useFormContext
import { FormField, FormItem, FormControl, FormMessage } from '@/components/ui/form'; // Import FormField components

interface PersonnelSectionProps {
  operatoriNetworkList: OperatoreNetwork[];
  pattugliaPersonale: Personale[];
  isOperatorNetworkOpen: boolean;
  setIsOperatorNetworkOpen: (open: boolean) => void;
  isGpgInterventionOpen: boolean;
  setIsGpgInterventionOpen: (open: boolean) => void;
}

export const PersonnelSection: React.FC<PersonnelSectionProps> = ({
  operatoriNetworkList,
  pattugliaPersonale,
  isOperatorNetworkOpen,
  setIsOperatorNetworkOpen,
  isGpgInterventionOpen,
  setIsGpgInterventionOpen,
}) => {
  const { control, watch } = useFormContext(); // Get form methods from context

  const formData = watch(); // Watch all form data

  return (
    <section className="space-y-4">
      <FormField
        control={control}
        name="operatorNetworkId"
        render={({ field }) => (
          <FormItem className="space-y-2">
            <Label htmlFor="operator-network">Operatore Network</Label>
            <Popover open={isOperatorNetworkOpen} onOpenChange={setIsOperatorNetworkOpen}>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={isOperatorNetworkOpen}
                    className="w-full justify-between"
                  >
                    {field.value
                      ? operatoriNetworkList.find(op => op.id === field.value)?.nome + " " + (operatoriNetworkList.find(op => op.id === field.value)?.cognome || '')
                      : "Seleziona operatore network..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                  <CommandInput placeholder="Cerca operatore network..." />
                  <CommandEmpty>Nessun operatore trovato.</CommandEmpty>
                  <CommandGroup>
                    {operatoriNetworkList.map((op) => (
                      <CommandItem
                        key={op.id}
                        value={`${op.nome} ${op.cognome || ''}`}
                        onSelect={() => {
                          field.onChange(op.id);
                          setIsOperatorNetworkOpen(false);
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
        name="gpgIntervention"
        render={({ field }) => (
          <FormItem className="space-y-2">
            <Label htmlFor="gpg-intervention">G.P.G. Intervento *</Label>
            <Popover open={isGpgInterventionOpen} onOpenChange={setIsGpgInterventionOpen}>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={isGpgInterventionOpen}
                    className="w-full justify-between"
                  >
                    {field.value
                      ? pattugliaPersonale.find(p => p.id === field.value)?.nome + " " + pattugliaPersonale.find(p => p.id === field.value)?.cognome
                      : "Seleziona G.P.G. intervento..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                  <CommandInput placeholder="Cerca G.P.G. intervento..." />
                  <CommandEmpty>Nessun G.P.G. trovato.</CommandEmpty>
                  <CommandGroup>
                    {pattugliaPersonale.map((personale) => (
                      <CommandItem
                        key={personale.id}
                        value={`${personale.nome} ${personale.cognome || ''}`}
                        onSelect={() => {
                          field.onChange(personale.id);
                          setIsGpgInterventionOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            field.value === personale.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {personale.nome} {personale.cognome}
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
    </section>
  );
};