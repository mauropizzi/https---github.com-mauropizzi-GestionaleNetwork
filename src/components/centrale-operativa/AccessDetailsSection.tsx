import React from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useFormContext } from 'react-hook-form'; // Import useFormContext
import { FormField, FormItem, FormControl, FormMessage } from '@/components/ui/form'; // Import FormField components

export const AccessDetailsSection: React.FC = () => {
  const { control, watch } = useFormContext(); // Get form methods from context

  const formData = watch(); // Watch all form data

  return (
    <section className="space-y-4">
      <FormField
        control={control}
        name="fullAccess"
        render={({ field }) => (
          <FormItem className="space-y-2">
            <Label>Accesso Completo</Label>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                value={field.value || ''}
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="si" id="fullAccessSi" />
                  <Label htmlFor="fullAccessSi">SI</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="fullAccessNo" />
                  <Label htmlFor="fullAccessNo">NO</Label>
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
            <Label>Accesso Caveau</Label>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                value={field.value || ''}
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="si" id="vaultAccessSi" />
                  <Label htmlFor="vaultAccessSi">SI</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="vaultAccessNo" />
                  <Label htmlFor="vaultAccessNo">NO</Label>
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