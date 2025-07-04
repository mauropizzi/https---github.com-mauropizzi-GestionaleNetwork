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
import { Textarea } from "@/components/ui/textarea";
import { XCircle } from "lucide-react";
import { clientContactDepartments } from "@/lib/client-data";

interface ClientContactFormSectionProps {
  index: number;
  onRemove: (index: number) => void;
}

export function ClientContactFormSection({ index, onRemove }: ClientContactFormSectionProps) {
  const { control } = useFormContext();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-md relative">
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
        name={`contacts.${index}.department`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Dipartimento</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona dipartimento" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {clientContactDepartments.map((option) => (
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
        name={`contacts.${index}.contact_name`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nome Contatto</FormLabel>
            <FormControl>
              <Input placeholder="Nome del referente" {...field} value={field.value || ''} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name={`contacts.${index}.email`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Email</FormLabel>
            <FormControl>
              <Input type="email" placeholder="email@esempio.com" {...field} value={field.value || ''} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name={`contacts.${index}.phone`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Telefono</FormLabel>
            <FormControl>
              <Input placeholder="Numero di telefono" {...field} value={field.value || ''} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name={`contacts.${index}.notes`}
        render={({ field }) => (
          <FormItem className="md:col-span-2">
            <FormLabel>Note</FormLabel>
            <FormControl>
              <Textarea placeholder="Note aggiuntive sul contatto..." rows={2} {...field} value={field.value || ''} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}