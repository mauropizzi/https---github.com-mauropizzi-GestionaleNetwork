import React from "react";
import { useForm, FormProvider } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { it } from 'date-fns/locale';
import { showSuccess, showError } from "@/utils/toast"; // Import toast utilities
import { supabase } from "@/integrations/supabase/client"; // Import Supabase client

const formSchema = z.object({
  nome: z.string().min(2, "Il nome è richiesto."),
  cognome: z.string().min(2, "Il cognome è richiesto."),
  codiceFiscale: z.string().optional().nullable(),
  ruolo: z.enum(["Pattuglia", "Operatore Network", "GPG", "Operatore C.O."], {
    required_error: "Seleziona un ruolo.",
  }),
  telefono: z.string().optional().nullable(),
  email: z.string().email("Formato email non valido.").optional().nullable().or(z.literal("")),
  data_nascita: z.date().optional().nullable(),
  luogo_nascita: z.string().optional().nullable(),
  indirizzo: z.string().optional().nullable(),
  cap: z.string().optional().nullable(),
  citta: z.string().optional().nullable(),
  provincia: z.string().optional().nullable(),
  data_assunzione: z.date().optional().nullable(),
  data_cessazione: z.date().optional().nullable(),
  attivo: z.boolean().default(true).optional(),
  note: z.string().optional().nullable(),
});

export function PersonaleForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
      cognome: "",
      codiceFiscale: null,
      ruolo: "Pattuglia", // Default to a new valid role
      telefono: null,
      email: null,
      data_nascita: null,
      luogo_nascita: null,
      indirizzo: null,
      cap: null,
      citta: null,
      provincia: null,
      data_assunzione: null,
      data_cessazione: null,
      attivo: true,
      note: null,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const payload = {
      nome: values.nome,
      cognome: values.cognome,
      codice_fiscale: values.codiceFiscale || null,
      ruolo: values.ruolo,
      telefono: values.telefono || null,
      email: values.email || null,
      data_nascita: values.data_nascita ? format(values.data_nascita, 'yyyy-MM-dd') : null,
      luogo_nascita: values.luogo_nascita || null,
      indirizzo: values.indirizzo || null,
      cap: values.cap || null,
      citta: values.citta || null,
      provincia: values.provincia || null,
      data_assunzione: values.data_assunzione ? format(values.data_assunzione, 'yyyy-MM-dd') : null,
      data_cessazione: values.data_cessazione ? format(values.data_cessazione, 'yyyy-MM-dd') : null,
      attivo: values.attivo,
      note: values.note || null,
    };

    const { data, error } = await supabase
      .from('personale')
      .insert([payload])
      .select(); // Use .select() to get the inserted data back

    if (error) {
      showError(`Errore durante la registrazione del personale: ${error.message}`);
      console.error("Error inserting personale:", error);
    } else {
      showSuccess("Personale salvato con successo!");
      console.log("Dati Personale salvati:", data);
      form.reset(); // Reset form after successful submission
    }
  };

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <h3 className="text-lg font-semibold">Dettagli Personale</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="nome"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome</FormLabel>
                <FormControl>
                  <Input placeholder="Nome" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="cognome"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cognome</FormLabel>
                <FormControl>
                  <Input placeholder="Cognome" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="codiceFiscale"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Codice Fiscale</FormLabel>
              <FormControl>
                <Input placeholder="Codice Fiscale" {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="ruolo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ruolo</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona un ruolo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Pattuglia">Pattuglia</SelectItem>
                  <SelectItem value="Operatore Network">Operatore Network</SelectItem>
                  <SelectItem value="GPG">GPG</SelectItem>
                  <SelectItem value="Operatore C.O.">Operatore C.O.</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="telefono"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefono</FormLabel>
                <FormControl>
                  <Input placeholder="Telefono" {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="email@example.com" {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Nuovi campi: Data di Nascita e Luogo di Nascita */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="data_nascita"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data di Nascita</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP", { locale: it })
                        ) : (
                          <span>Seleziona una data</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value || undefined}
                      onSelect={field.onChange}
                      initialFocus
                      locale={it}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="luogo_nascita"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Luogo di Nascita</FormLabel>
                <FormControl>
                  <Input placeholder="Luogo di Nascita" {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Nuovi campi: Indirizzo, CAP, Città, Provincia */}
        <FormField
          control={form.control}
          name="indirizzo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Indirizzo</FormLabel>
              <FormControl>
                <Input placeholder="Via, numero civico" {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="citta"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Città</FormLabel>
                <FormControl>
                  <Input placeholder="Città" {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="cap"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CAP</FormLabel>
                <FormControl>
                  <Input placeholder="CAP" {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="provincia"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Provincia</FormLabel>
                <FormControl>
                  <Input placeholder="Provincia" {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Nuovi campi: Data Assunzione e Data Cessazione */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="data_assunzione"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data di Assunzione</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP", { locale: it })
                        ) : (
                          <span>Seleziona una data</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value || undefined}
                      onSelect={field.onChange}
                      initialFocus
                      locale={it}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="data_cessazione"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data di Cessazione</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP", { locale: it })
                        ) : (
                          <span>Seleziona una data</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value || undefined}
                      onSelect={field.onChange}
                      initialFocus
                      locale={it}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Nuovo campo: Attivo */}
        <FormField
          control={form.control}
          name="attivo"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  Personale Attivo
                </FormLabel>
              </div>
            </FormItem>
          )}
        />

        {/* Nuovo campo: Note */}
        <FormField
          control={form.control}
          name="note"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Note Aggiuntive</FormLabel>
              <FormControl>
                <Textarea placeholder="Note sul personale..." {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full">Salva Personale</Button>
      </form>
    </FormProvider>
  );
}