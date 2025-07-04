import React from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { useFormContext } from 'react-hook-form'; // Import useFormContext
import { FormField, FormItem, FormControl, FormMessage } from '@/components/ui/form'; // Import FormField components

export const AnomaliesDelaySection: React.FC = () => {
  const { control, watch } = useFormContext(); // Get form methods from context

  const formData = watch(); // Watch all form data

  return (
    <section className="space-y-4">
      <FormField
        control={control}
        name="anomalies"
        render={({ field }) => (
          <FormItem className="space-y-2">
            <Label>Anomalie Riscontrate</Label>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                value={field.value || ''}
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="si" id="anomaliesSi" />
                  <Label htmlFor="anomaliesSi">SI</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="anomaliesNo" />
                  <Label htmlFor="anomaliesNo">NO</Label>
                </div>
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      {formData.anomalies === 'si' && (
        <FormField
          control={control}
          name="anomalyDescription"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Textarea
                  id="anomalyDescription"
                  placeholder="Descrivi le anomalie riscontrate..."
                  {...field}
                  value={field.value || ''}
                  className="mt-2"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      <FormField
        control={control}
        name="delay"
        render={({ field }) => (
          <FormItem className="space-y-2">
            <Label>Ritardo</Label>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                value={field.value || ''}
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="si" id="delaySi" />
                  <Label htmlFor="delaySi">SI</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="delayNo" />
                  <Label htmlFor="delayNo">NO</Label>
                </div>
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      {formData.delay === 'si' && (
        <FormField
          control={control}
          name="delayNotes"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Textarea
                  id="delayNotes"
                  placeholder="Motivo del ritardo..."
                  {...field}
                  value={field.value || ''}
                  className="mt-2"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </section>
  );
};