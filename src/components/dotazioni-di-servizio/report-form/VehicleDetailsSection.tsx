import React from "react";
import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  vehicleMakeModelOptions,
  vehiclePlateOptions,
  vehicleInitialStateOptions,
  vehicleDamageOptions,
} from "@/lib/dotazioni-data";

export const VehicleDetailsSection: React.FC = () => {
  const { control } = useFormContext();

  return (
    <section className="p-4 border rounded-lg shadow-sm bg-card">
      <h3 className="text-lg font-semibold mb-4">Dettagli Veicolo</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={control}
          name="vehicleMakeModel"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Marca/Modello Veicolo</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona marca/modello" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {vehicleMakeModelOptions.map((option) => (
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
          name="vehiclePlate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Targa Veicolo</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona targa" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {vehiclePlateOptions.map((option) => (
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
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <FormField
          control={control}
          name="startKm"
          render={({ field }) => (
            <FormItem>
              <FormLabel>KM Iniziali</FormLabel>
              <FormControl>
                <Input type="number" step="0.1" placeholder="0.0" {...field} onChange={e => field.onChange(e.target.valueAsNumber)} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="endKm"
          render={({ field }) => (
            <FormItem>
              <FormLabel>KM Finali</FormLabel>
              <FormControl>
                <Input type="number" step="0.1" placeholder="0.0" {...field} onChange={e => field.onChange(e.target.valueAsNumber)} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <FormField
          control={control}
          name="vehicleInitialState"
          render={({ field }) => (
            <FormItem className="mt-4">
              <FormLabel>Stato Veicolo</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona stato" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {vehicleInitialStateOptions.map((option) => (
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
          name="danniVeicolo"
          render={({ field }) => (
            <FormItem className="mt-4">
              <FormLabel>Danni Veicolo</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona danni" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {vehicleDamageOptions.map((option) => (
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
        name="vehicleAnomalies"
        render={({ field }) => (
          <FormItem className="mt-4">
            <FormLabel>Anomalie Veicolo (se presenti)</FormLabel>
            <FormControl>
              <Textarea placeholder="Descrivi eventuali anomalie..." rows={3} {...field} value={field.value || ''} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </section>
  );
};