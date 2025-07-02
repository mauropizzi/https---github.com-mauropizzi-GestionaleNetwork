import React, { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Cliente, serviceTypeRateOptions } from '@/lib/anagrafiche-data';
import { getUnitaMisuraForServizio } from '@/lib/tariff-utils';
import { unitaMisuraOptions } from './TariffConstants';

interface TariffCoreDetailsProps {
  clienti: Cliente[];
  loading: boolean;
}

export const TariffCoreDetails: React.FC<TariffCoreDetailsProps> = ({ clienti, loading }) => {
  const { control, watch, setValue } = useFormContext();
  const tipoServizio = watch("tipo_servizio");

  useEffect(() => {
    const unita = getUnitaMisuraForServizio(tipoServizio);
    setValue("unita_misura", unita, { shouldValidate: true });
  }, [tipoServizio, setValue]);

  return (
    <>
      <FormField
        control={control}
        name="cliente_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Cliente</FormLabel>
            <Select
              onValueChange={(value) => field.onChange(value === "DYAD_EMPTY_VALUE" ? "" : value)}
              value={field.value || "DYAD_EMPTY_VALUE"}
              disabled={loading}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona un cliente" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="DYAD_EMPTY_VALUE">Seleziona un cliente</SelectItem>
                {clienti.map((cliente) => (
                  <SelectItem key={cliente.id} value={cliente.id}>
                    {cliente.nome_cliente}
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
        name="tipo_servizio"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Tipo di Servizio</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona tipo di servizio" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {serviceTypeRateOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
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
        name="unita_misura"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Unità di Misura</FormLabel>
            <Select onValueChange={field.onChange} value={field.value} disabled>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Impostata automaticamente dal tipo di servizio" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {unitaMisuraOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
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