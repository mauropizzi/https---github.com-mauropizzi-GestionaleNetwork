import React from 'react';
import { useFormContext } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

export const TariffRateFields: React.FC = () => {
  const { control } = useFormContext();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField
        control={control}
        name="client_rate"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Importo Cliente (€)</FormLabel>
            <FormControl>
              <Input type="number" step="0.01" placeholder="0.00" {...field} onChange={e => field.onChange(e.target.valueAsNumber)} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="supplier_rate"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Importo Fornitore (€)</FormLabel>
            <FormControl>
              <Input type="number" step="0.01" placeholder="0.00" {...field} onChange={e => field.onChange(e.target.valueAsNumber)} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};