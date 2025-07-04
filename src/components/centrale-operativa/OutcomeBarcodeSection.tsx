import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { serviceOutcomeOptions } from '@/lib/centrale-options';
import { useFormContext } from 'react-hook-form'; // Import useFormContext

export const OutcomeBarcodeSection: React.FC = () => {
  const { watch, setValue } = useFormContext(); // Get form methods from context

  const formData = watch(); // Watch all form data

  return (
    <section className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="service-outcome">Esito Evento</Label>
        <Select
          onValueChange={(value) => setValue('serviceOutcome', value)} // Use setValue
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
          value={formData.barcode || ''} // Ensure controlled component
          onChange={(e) => setValue('barcode', e.target.value)} // Use setValue
        />
      </div>
    </section>
  );
};