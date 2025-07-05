import React from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { showSuccess, showError, showInfo } from "@/utils/toast";
import { supabase } from '@/integrations/supabase/client';
import { appRoutes } from '@/lib/app-routes';

interface UserCreateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUserCreated: () => void;
}

const formSchema = z.object({
  email: z.string().email("Formato email non valido."),
  password: z.string().min(8, "La password deve essere di almeno 8 caratteri."),
  first_name: z.string().optional().nullable(),
  last_name: z.string().optional().nullable(),
  role: z.enum(['Amministratore', 'Amministrazione', 'Centrale Operativa', 'Personale esterno'], {
    required_error: "Il ruolo è richiesto.",
  }),
  allowed_routes: z.array(z.string()).optional(),
});

export function UserCreateDialog({ isOpen, onClose, onUserCreated }: UserCreateDialogProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      first_name: null,
      last_name: null,
      role: 'Personale esterno',
      allowed_routes: [],
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    showInfo("Creazione nuovo utente in corso...");

    const { data, error } = await supabase.functions.invoke('create-user', {
      body: values,
    });

    if (error) {
      showError(`Errore durante la creazione dell'utente: ${error.message}`);
      console.error("Error creating user via Edge Function:", error);
    } else {
      showSuccess(`Utente "${values.email}" creato con successo! Verrà inviata un'email di conferma.`);
      onUserCreated();
      form.reset();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crea Nuovo Utente</DialogTitle>
          <DialogDescription>
            Compila i campi per creare un nuovo utente e assegnargli un ruolo. L'utente dovrà confermare il proprio indirizzo email.
          </DialogDescription>
        </DialogHeader>
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="email@esempio.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="first_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="last_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cognome</FormLabel>
                  <FormControl>
                    <Input placeholder="Cognome" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ruolo</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona ruolo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Amministratore">Amministratore</SelectItem>
                      <SelectItem value="Amministrazione">Amministrazione</SelectItem>
                      <SelectItem value="Centrale Operativa">Centrale Operativa</SelectItem>
                      <SelectItem value="Personale esterno">Personale esterno</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="space-y-2 mt-4">
              <FormLabel>Pagine Consentite</FormLabel>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-60 overflow-y-auto border p-2 rounded-md">
                {appRoutes.map((route) => (
                  <FormField
                    key={route.path}
                    control={form.control}
                    name="allowed_routes"
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={route.path}
                          className="flex flex-row items-start space-x-2 space-y-0"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(route.path)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...(field.value || []), route.path])
                                  : field.onChange(
                                      (field.value || []).filter(
                                        (value) => value !== route.path
                                      )
                                    );
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal cursor-pointer">
                            {route.label}
                          </FormLabel>
                        </FormItem>
                      );
                    }}
                  />
                ))}
              </div>
              <FormMessage />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={onClose}>Annulla</Button>
              <Button type="submit">Crea Utente</Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}