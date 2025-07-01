import React from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface AccessDetailsSectionProps {
  formData: any;
  handleRadioChange: (name: string, value: 'si' | 'no') => void;
}

export const AccessDetailsSection: React.FC<AccessDetailsSectionProps> = ({
  formData,
  handleRadioChange,
}) => {
  return (
    <section className="space-y-4">
      <div className="space-y-2">
        <Label>Accesso Completo</Label>
        <RadioGroup
          value={formData.fullAccess}
          onValueChange={(value: 'si' | 'no') => handleRadioChange('fullAccess', value)}
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
      </div>

      <div className="space-y-2">
        <Label>Accesso Caveau</Label>
        <RadioGroup
          value={formData.vaultAccess}
          onValueChange={(value: 'si' | 'no') => handleRadioChange('vaultAccess', value)}
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
      </div>
    </section>
  );
};