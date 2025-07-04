import React from "react";
import { useFormContext } from "react-hook-form";
import {
  FormControl,
  FormField, // Import FormField
  FormItem, // Import FormItem
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function VehicleDetailsSection() {
  const { control, register } = useFormContext();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Vehicle Make/Model */}
      <FormField
        control={control}
        name="vehicleMakeModel"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Marca/Modello Veicolo</FormLabel>
            <FormControl>
              <Input placeholder="Es. Fiat Panda" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Vehicle Plate */}
      <FormField
        control={control}
        name="vehiclePlate"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Targa Veicolo</FormLabel>
            <FormControl>
              <Input placeholder="Es. AB123CD" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Start KM */}
      <FormField
        control={control}
        name="startKm"
        render={({ field }) => (
          <FormItem>
            <FormLabel>KM Iniziali</FormLabel>
            <FormControl>
              <Input type="number" placeholder="0" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* End KM */}
      <FormField
        control={control}
        name="endKm"
        render={({ field }) => (
          <FormItem>
            <FormLabel>KM Finali</FormLabel>
            <FormControl>
              <Input type="number" placeholder="0" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Vehicle Initial State */}
      <FormField
        control={control}
        name="vehicleInitialState"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Stato Veicolo</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona lo stato del veicolo" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="OTTIMO">OTTIMO</SelectItem>
                <SelectItem value="BUONO">BUONO</SelectItem>
                <SelectItem value="DISCRETO">DISCRETO</SelectItem>
                <SelectItem value="SCARSO">SCARSO</SelectItem>
                <SelectItem value="RICHIESTA MANUTENZIONE">RICHIESTA MANUTENZIONE</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Danni Veicolo */}
      <FormField
        control={control}
        name="danniVeicolo"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Danni Veicolo (se presenti)</FormLabel>
            <FormControl>
              <Textarea placeholder="Descrivi eventuali danni" {...field} value={field.value || ''} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Vehicle Anomalies */}
      <FormField
        control={control}
        name="vehicleAnomalies"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Anomalie Veicolo (se presenti)</FormLabel>
            <FormControl>
              <Textarea placeholder="Descrivi eventuali anomalie" {...field} value={field.value || ''} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}