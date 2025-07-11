import React from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { useFormContext } from 'react-hook-form';
import { FormField, FormItem, FormControl, FormMessage, FormLabel } from '@/components/ui/form';

export const AnomaliesDelaySection: React.FC = () => {
  const { control, watch } = useFormContext();

  const formData = watch();

  return (
    <section className="space-y-4">
      <FormField
        control={control}
        name="anomalies"
        render={({ field }) => (
          <FormItem className="space-y-2">
            <FormLabel>Anomalie Riscontrate</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                value={field.value || ''}
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="si" id="anomaliesSi" />
                  <label htmlFor="anomaliesSi" className="font-normal cursor-pointer">SI</label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="anomaliesNo" />
                  <label htmlFor="anomaliesNo" className="font-normal cursor-pointer">NO</label>
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
            <FormLabel>Ritardo</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                value={field.value || ''}
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="si" id="delaySi" />
                  <label htmlFor="delaySi" className="font-normal cursor-pointer">SI</label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="delayNo" />
                  <label htmlFor="delayNo" className="font-normal cursor-pointer">NO</label>
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