import React from 'react';
import { useFormContext } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PuntoServizio, Fornitore } from '@/lib/anagrafiche-data';

interface TariffAssociationFieldsProps {
  puntiServizio: PuntoServizio[];
  fornitori: Fornitore[];
}

export const TariffAssociationFields: React.FC<TariffAssociationFieldsProps> = ({ puntiServizio, fornitori }) => {
  const { control } = useFormContext();

  return (
    <>
      <FormField
        control={control}
        name="punto_servizio_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Punto Servizio Associato (Opzionale)</FormLabel>
            <Select
              onValueChange={(value) => field.onChange(value === "DYAD_EMPTY_VALUE" ? "" : value)}
              value={field.value || "DYAD_EMPTY_VALUE"}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona un punto servizio" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="DYAD_EMPTY_VALUE">Nessun Punto Servizio Specifico</SelectItem>
                {puntiServizio.map((punto) => (
                  <SelectItem key={punto.id} value={punto.id}>
                    {punto.nome_punto_servizio}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="fornitore_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Fornitore Associato (Opzionale)</FormLabel>
            <Select
              onValueChange={(value) => field.onChange(value === "DYAD_EMPTY_VALUE" ? "" : value)}
              value={field.value || "DYAD_EMPTY_VALUE"}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona un fornitore" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="DYAD_EMPTY_VALUE">Nessun Fornitore Specifico</SelectItem>
                {fornitori.map((fornitore) => (
                  <SelectItem key={fornitore.id} value={fornitore.id}>
                    {fornitore.nome_fornitore}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
};