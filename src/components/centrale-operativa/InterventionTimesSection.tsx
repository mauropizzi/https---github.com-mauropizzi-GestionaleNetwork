import React from 'react';
import { useFormContext } from 'react-hook-form'; // Import useFormContext
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'; // Import Form components
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface InterventionTimesSectionProps {
  handleSetCurrentTime: (field: 'startTime' | 'endTime') => void;
  handleEndGpsTracking: () => void;
}

export const InterventionTimesSection: React.FC<InterventionTimesSectionProps> = ({
  handleSetCurrentTime,
  handleEndGpsTracking,
}) => {
  const { control, watch } = useFormContext(); // Get control and watch from context

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={control}
          name="startTime"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel htmlFor="startTime">Orario Inizio Intervento</FormLabel>
              <div className="flex gap-2">
                <FormControl>
                  <Input
                    type="datetime-local"
                    id="startTime"
                    {...field} // Pass all field props
                    value={field.value || ''} // Ensure controlled component
                  />
                </FormControl>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => handleSetCurrentTime('startTime')}
                >
                  Ora Attuale
                </Button>
              </div>
              <Button 
                type="button" 
                className="w-full bg-blue-600 hover:bg-blue-700" 
                onClick={handleEndGpsTracking}
              >
                Posizione GPS Inizio Intervento
              </Button>
              {(watch('startLatitude') !== null && watch('startLongitude') !== null) && (
                <p className="text-sm text-gray-500 mt-1 text-center">
                  Latitudine: {watch('startLatitude')?.toFixed(6)}, Longitudine: {watch('startLongitude')?.toFixed(6)}
                </p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="endTime"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel htmlFor="endTime">Orario Fine Intervento</FormLabel>
              <div className="flex gap-2">
                <FormControl>
                  <Input
                    type="datetime-local"
                    id="endTime"
                    {...field} // Pass all field props
                    value={field.value || ''} // Ensure controlled component
                  />
                </FormControl>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => handleSetCurrentTime('endTime')}
                >
                  Ora Attuale
                </Button>
              </div>
              {(watch('endLatitude') !== null && watch('endLongitude') !== null) && (
                <p className="text-sm text-gray-500 mt-1 text-center">
                  Latitudine: {watch('endLatitude')?.toFixed(6)}, Longitudine: {watch('endLongitude')?.toFixed(6)}
                </p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </section>
  );
};