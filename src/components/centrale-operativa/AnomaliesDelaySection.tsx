import React from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { useFormContext } from 'react-hook-form'; // Import useFormContext

export const AnomaliesDelaySection: React.FC = () => {
  const { watch, setValue } = useFormContext(); // Get form methods from context

  const formData = watch(); // Watch all form data

  return (
    <section className="space-y-4">
      <div className="space-y-2">
        <Label>Anomalie Riscontrate</Label>
        <RadioGroup
          value={formData.anomalies}
          onValueChange={(value: 'si' | 'no') => setValue('anomalies', value)} // Use setValue
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
        {formData.anomalies === 'si' && (
          <Textarea
            id="anomalyDescription"
            name="anomalyDescription"
            placeholder="Descrivi le anomalie riscontrate..."
            value={formData.anomalyDescription || ''} // Ensure controlled component
            onChange={(e) => setValue('anomalyDescription', e.target.value)} // Use setValue
            className="mt-2"
          />
        )}
      </div>

      <div className="space-y-2">
        <Label>Ritardo</Label>
        <RadioGroup
          value={formData.delay}
          onValueChange={(value: 'si' | 'no') => setValue('delay', value)} // Use setValue
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
        {formData.delay === 'si' && (
          <Textarea
            id="delayNotes"
            name="delayNotes"
            placeholder="Motivo del ritardo..."
            value={formData.delayNotes || ''} // Ensure controlled component
            onChange={(e) => setValue('delayNotes', e.target.value)} // Use setValue
            className="mt-2"
          />
        )}
      </div>
    </section>
  );
};