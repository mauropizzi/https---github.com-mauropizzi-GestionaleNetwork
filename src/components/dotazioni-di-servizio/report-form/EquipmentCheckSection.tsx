import React from "react";
import { useFormContext } from "react-hook-form";
import {
  FormControl,
  FormField, // Import FormField
  FormItem, // Import FormItem
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export function EquipmentCheckSection() {
  const { control } = useFormContext();

  const equipmentItems = [
    { name: "gps", label: "GPS" },
    { name: "radioVehicle", label: "Radio Veicolare" },
    { name: "swivelingLamp", label: "Faro Girevole" },
    { name: "radioPortable", label: "Radio Portatile" },
    { name: "flashlight", label: "Torcia" },
    { name: "extinguisher", label: "Estintore" },
    { name: "spareTire", label: "Ruota di Scorta" },
    { name: "highVisibilityVest", label: "Giubbotto Alta Visibilità" },
  ] as const; // Use 'as const' for type inference

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {equipmentItems.map((item) => (
        <FormField
          key={item.name}
          control={control}
          name={item.name}
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>{item.label}</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value}
                  className="flex flex-row space-x-4"
                >
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <RadioGroupItem value="si" />
                    </FormControl>
                    <FormLabel className="font-normal">Si</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <RadioGroupItem value="no" />
                    </FormControl>
                    <FormLabel className="font-normal">No</FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      ))}
    </div>
  );
}