import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface InterventionTimesSectionProps {
  formData: any;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSetCurrentTime: (field: string) => void;
  handleEndGpsTracking: () => void;
}

export const InterventionTimesSection: React.FC<InterventionTimesSectionProps> = ({
  formData,
  handleInputChange,
  handleSetCurrentTime,
  handleEndGpsTracking,
}) => {
  return (
    <section className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startTime">Orario Inizio Intervento</Label>
          <div className="flex gap-2">
            <Input
              type="datetime-local"
              id="startTime"
              name="startTime"
              value={formData.startTime}
              onChange={handleInputChange}
              className="flex-1"
            />
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
          {formData.endLatitude !== undefined && formData.endLongitude !== undefined && (
            <p className="text-sm text-gray-500 mt-1 text-center">
              Latitudine: {formData.endLatitude?.toFixed(6)}, Longitudine: {formData.endLongitude?.toFixed(6)}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="endTime">Orario Fine Intervento</Label>
          <div className="flex gap-2">
            <Input
              type="datetime-local"
              id="endTime"
              name="endTime"
              value={formData.endTime}
              onChange={handleInputChange}
              className="flex-1"
            />
            <Button 
              type="button" 
              variant="outline"
              onClick={() => handleSetCurrentTime('endTime')}
            >
              Ora Attuale
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};