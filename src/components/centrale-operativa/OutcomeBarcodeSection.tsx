import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { serviceOutcomeOptions } from '@/lib/centrale-options';

interface OutcomeBarcodeSectionProps {
  formData: any;
  handleSelectChange: (name: string, value: string) => void;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

export const OutcomeBarcodeSection: React.FC<OutcomeBarcodeSectionProps> = ({
  formData,
  handleSelectChange,
  handleInputChange,
}) => {
  return (
    <section className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="service-outcome">Esito Evento</Label>
        <Select
          onValueChange={(value) => handleSelectChange('serviceOutcome', value)}
          value={formData.serviceOutcome}
        >
          <SelectTrigger>
            <SelectValue placeholder="Seleziona esito..." />
          </SelectTrigger>
          <SelectContent>
            {serviceOutcomeOptions.map(option => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="barcode">Barcode</Label>
        <Input
          type="text"
          id="barcode"
          name="barcode"
          placeholder="Inserisci barcode..."
          value={formData.barcode}
          onChange={handleInputChange}
        />
      </div>
    </section>
  );
};