import React from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';

interface AnomaliesDelaySectionProps {
  formData: any;
  handleRadioChange: (name: string, value: 'si' | 'no') => void;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

export const AnomaliesDelaySection: React.FC<AnomaliesDelaySectionProps> = ({
  formData,
  handleRadioChange,
  handleInputChange,
}) => {
  return (
    <section className="space-y-4">
      <div className="space-y-2">
        <Label>Anomalie Riscontrate</Label>
        <RadioGroup
          value={formData.anomalies}
          onValueChange={(value: 'si' | 'no') => handleRadioChange('anomalies', value)}
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
            value={formData.anomalyDescription}
            onChange={handleInputChange}
            className="mt-2"
          />
        )}
      </div>

      <div className="space-y-2">
        <Label>Ritardo</Label>
        <RadioGroup
          value={formData.delay}
          onValueChange={(value: 'si' | 'no') => handleRadioChange('delay', value)}
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
            value={formData.delayNotes}
            onChange={handleInputChange}
            className="mt-2"
          />
        )}
      </div>
    </section>
  );
};