import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { serviceOutcomeOptions } from '@/lib/centrale-options';
import { useFormContext } from 'react-hook-form'; // Import useFormContext
import { FormField, FormItem, FormControl, FormMessage } from '@/components/ui/form'; // Import FormField components

export const OutcomeBarcodeSection: React.FC = () => {
  const { control, watch } = useFormContext(); // Get form methods from context

  const formData = watch(); // Watch all form data

  return (
    <section className="space-y-4">
      <FormField
        control={control}
        name="serviceOutcome"
        render={({ field }) => (
          <FormItem className="space-y-2">
            <Label htmlFor="service-outcome">Esito Evento</Label>
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
            <Label htmlFor="barcode">Barcode</Label>
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