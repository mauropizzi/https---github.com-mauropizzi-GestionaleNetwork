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
import { tipologiaAttrezzoOptions, marcaAttrezzoOptions } from "@/lib/cantiere-data";

interface AttrezzoItemProps {
  index: number;
  onRemove: (index: number) => void;
}

export function AttrezzoItem({ index, onRemove }: AttrezzoItemProps) {
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
        name={`attrezzi.${index}.tipologia`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Tipologia Attrezzo</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona tipologia" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {tipologiaAttrezzoOptions.map((option) => (
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
        name={`attrezzi.${index}.marca`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Marca Attrezzo</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona marca" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {marcaAttrezzoOptions.map((option) => (
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
        name={`attrezzi.${index}.quantita`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Quantità</FormLabel>
            <FormControl>
              <Input type="number" placeholder="1" {...field} onChange={e => field.onChange(e.target.valueAsNumber)} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}