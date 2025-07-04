import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { serviceOutcomeOptions } from '@/lib/centrale-options';
import { useFormContext } from 'react-hook-form';
import { FormField, FormItem, FormControl, FormMessage, FormLabel } from '@/components/ui/form'; // Added FormLabel

export const OutcomeBarcodeSection: React.FC = () => {
  const { control, watch } = useFormContext();

  const formData = watch();

  return (
    <section className="space-y-4">
      <FormField
        control={control}
        name="serviceOutcome"
        render={({ field }) => (
          <FormItem className="space-y-2">
            <FormLabel>Esito Evento</FormLabel>
            <Select
              onValueChange={field.onChange}
              value={field.value || ''}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona esito..." />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {serviceOutcomeOptions.map(option => (
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
        name="barcode"
        render={({ field }) => (
          <FormItem className="space-y-2">
            <FormLabel>Barcode</FormLabel>
            <FormControl>
              <Input
                type="text"
                id="barcode"
                placeholder="Inserisci barcode..."
                {...field}
                value={field.value || ''}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </section>
  );
};