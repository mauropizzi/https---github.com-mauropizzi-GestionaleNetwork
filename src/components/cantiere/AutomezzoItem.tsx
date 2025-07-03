import React from "react";
import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import { XCircle } from "lucide-react";
import { tipologiaAutomezzoOptions, marcaAutomezzoOptions } from "@/lib/cantiere-data";

interface AutomezzoItemProps {
  index: number;
  onRemove: (index: number) => void;
}

export function AutomezzoItem({ index, onRemove }: AutomezzoItemProps) {
  const { control } = useFormContext();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-md relative">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => onRemove(index)}
        className="absolute top-2 right-2 text-red-500 hover:text-red-700"
      >
        <XCircle className="h-5 w-5" />
      </Button>
      <FormField
        control={control}
        name={`automezzi.${index}.tipologia`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Tipologia Automezzo</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona tipologia" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {tipologiaAutomezzoOptions.map((option) => (
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
        name={`automezzi.${index}.marca`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Marca Automezzo</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona marca" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {marcaAutomezzoOptions.map((option) => (
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
        name={`automezzi.${index}.targa`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Targa</FormLabel>
            <FormControl>
              <Input placeholder="Targa" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}