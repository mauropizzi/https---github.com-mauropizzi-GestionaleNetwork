import React from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useFormContext } from 'react-hook-form';
import { FormField, FormItem, FormControl, FormMessage, FormLabel } from '@/components/ui/form';

export const AccessDetailsSection: React.FC = () => {
  const { control } = useFormContext();

  return (
    <section className="space-y-4">
      <FormField
        control={control}
        name="fullAccess"
        render={({ field }) => (
          <FormItem className="space-y-2">
            <FormLabel>Accesso Completo</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                value={field.value || ''}
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="si" id="fullAccessSi" />
                  <label htmlFor="fullAccessSi" className="font-normal cursor-pointer">SI</label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="fullAccessNo" />
                  <label htmlFor="fullAccessNo" className="font-normal cursor-pointer">NO</label>
                </div>
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="vaultAccess"
        render={({ field }) => (
          <FormItem className="space-y-2">
            <FormLabel>Accesso Caveau</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                value={field.value || ''}
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="si" id="vaultAccessSi" />
                  <label htmlFor="vaultAccessSi" className="font-normal cursor-pointer">SI</label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="vaultAccessNo" />
                  <label htmlFor="vaultAccessNo" className="font-normal cursor-pointer">NO</label>
                </div>
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </section>
  );
};