import React from "react";
import { useFormContext } from "react-hook-form";
import { Label } from "@/components/ui/label";
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export const EquipmentCheckSection: React.FC = () => {
  const { control } = useFormContext();

  return (
    <section className="p-4 border rounded-lg shadow-sm bg-card">
      <h3 className="text-lg font-semibold mb-4">Dotazioni Controllate</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={control}
          name="gps"
          render={({ field }) => (
            <FormItem className="flex flex-col space-y-2 rounded-md border p-4">
              <FormLabel>GPS</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value}
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="si" id="gps-si" />
                    <Label htmlFor="gps-si">SI</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="gps-no" />
                    <Label htmlFor="gps-no">NO</Label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="radioVehicle"
          render={({ field }) => (
            <FormItem className="flex flex-col space-y-2 rounded-md border p-4">
              <FormLabel>Radio Veicolare</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value}
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="si" id="radioVehicle-si" />
                    <Label htmlFor="radioVehicle-si">SI</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="radioVehicle-no" />
                    <Label htmlFor="radioVehicle-no">NO</Label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="swivelingLamp"
          render={({ field }) => (
            <FormItem className="flex flex-col space-y-2 rounded-md border p-4">
              <FormLabel>Faro Girevole</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value}
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="si" id="swivelingLamp-si" />
                    <Label htmlFor="swivelingLamp-si">SI</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="swivelingLamp-no" />
                    <Label htmlFor="swivelingLamp-no">NO</Label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="radioPortable"
          render={({ field }) => (
            <FormItem className="flex flex-col space-y-2 rounded-md border p-4">
              <FormLabel>Radio Portatile</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value}
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="si" id="radioPortable-si" />
                    <Label htmlFor="radioPortable-si">SI</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="radioPortable-no" />
                    <Label htmlFor="radioPortable-no">NO</Label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="flashlight"
          render={({ field }) => (
            <FormItem className="flex flex-col space-y-2 rounded-md border p-4">
              <FormLabel>Torcia</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value}
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="si" id="flashlight-si" />
                    <Label htmlFor="flashlight-si">SI</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="flashlight-no" />
                    <Label htmlFor="flashlight-no">NO</Label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="extinguisher"
          render={({ field }) => (
            <FormItem className="flex flex-col space-y-2 rounded-md border p-4">
              <FormLabel>Estintore</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value}
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="si" id="extinguisher-si" />
                    <Label htmlFor="extinguisher-si">SI</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="extinguisher-no" />
                    <Label htmlFor="extinguisher-no">NO</Label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="spareTire"
          render={({ field }) => (
            <FormItem className="flex flex-col space-y-2 rounded-md border p-4">
              <FormLabel>Ruota di Scorta</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value}
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="si" id="spareTire-si" />
                    <Label htmlFor="spareTire-si">SI</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="spareTire-no" />
                    <Label htmlFor="spareTire-no">NO</Label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="highVisibilityVest"
          render={({ field }) => (
            <FormItem className="flex flex-col space-y-2 rounded-md border p-4">
              <FormLabel>Giubbotto Alta Visibilità</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value}
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="si" id="highVisibilityVest-si" />
                    <Label htmlFor="highVisibilityVest-si">SI</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="highVisibilityVest-no" />
                    <Label htmlFor="highVisibilityVest-no">NO</Label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </section>
  );
};