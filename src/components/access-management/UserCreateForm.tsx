import React, { useEffect } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { showSuccess, showError } from "@/utils/toast";
import { supabase } from '@/integrations/supabase/client';
import { appRoutes } from '@/lib/app-routes'; // Import the app routes

interface UserCreateFormProps {
  onSaveSuccess: () => void;
  onCancel: () => void;
}

const formSchema = z.object({
  email: z.string().email("Formato email non valido.").min(1, "L'email è richiesta."),
  password: z.string().min(6, "La password deve essere lunga almeno 6 caratteri."),
  first_name: z.string().optional().nullable(),
  last_name: z.string().optional().nullable(),
  role: z.enum(['Amministratore', 'Amministrazione', 'Centrale Operativa', 'Personale esterno'], {
    required_error: "Il ruolo è richiesto.",
  }),
  allowed_routes: z.array(z.string()).optional(),
});

export function UserCreateForm({ onSaveSuccess, onCancel }: UserCreateFormProps) {
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

  const selectedRole = form.watch('role');

  // Automatically set default allowed routes based on role
  useEffect(() => {
    let defaultRoutes: string[] = [];
    if (selectedRole === 'Amministrazione') {
      defaultRoutes = ["/anagrafiche/clienti", "/anagrafiche/punti-servizio", "/anagrafiche/personale", "/anagrafiche/operatori-network", "/anagrafiche/fornitori", "/anagrafiche/tariffe", "/anagrafiche/procedure", "/servizi-a-canone", "/analisi-contabile", "/incoming-emails"];
    } else if (selectedRole === 'Centrale Operativa') {
      defaultRoutes = ["/", "/centrale-operativa", "/centrale-operativa/edit", "/incoming-emails"];
    } else if (selectedRole === 'Personale esterno') {
      defaultRoutes = ["/", "/centrale-operativa", "/service-request", "/service-list", "/dotazioni-di-servizio", "/registro-di-cantiere", "/richiesta-manutenzione"];
    } else if (selectedRole === 'Amministratore') {
      // Admins typically have access to everything, so we can either select all or leave it to policy.
      // For explicit control, let's select all available routes.
      defaultRoutes = appRoutes.map(route => route.path);
    }
    form.setValue('allowed_routes', defaultRoutes);
  }, [selectedRole, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const payload = {
      email: values.email,
      password: values.password,
      first_name: values.first_name || null,
      last_name: values.last_name || null,
      role: values.role,
      allowed_routes: values.allowed_routes,
    };

    const token = (await supabase.auth.getSession()).data.session?.access_token;

    if (!token) {
      showError("Sessione non trovata. Effettua nuovamente il login.");
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: payload,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (error) {
        showError(`Errore durante la creazione dell'utente: ${error.message}`);
        console.error("Error invoking create-user Edge Function:", error);
      } else {
        showSuccess("Utente creato con successo!");
        console.log("User created:", data);
        form.reset();
        onSaveSuccess();
      }
    } catch (err: any) {
      showError(`Si è verificato un errore imprevisto: ${err.message}`);
      console.error("Unexpected error in UserCreateForm onSubmit:", err);
    }
  };

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <h3 className="text-lg font-semibold">Dettagli Nuovo Utente</h3>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="email@example.com" {...field} />
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
                <Input type="password" placeholder="Minimo 6 caratteri" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        </div>
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

        {/* Allowed Routes selection */}
        <div className="space-y-2 mt-4">
          <FormLabel>Pagine Consentite</FormLabel>
          <p className="text-sm text-muted-foreground">Seleziona le pagine a cui questo utente può accedere. Se nessuna pagina è selezionata, l'utente non potrà accedere a nessuna pagina protetta (eccetto gli Amministratori).</p>
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
                          disabled={selectedRole === 'Amministratore'} // Disable for admin role
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

        <div className="flex justify-end gap-2 mt-6">
          <Button type="button" variant="outline" onClick={onCancel}>
            Annulla
          </Button>
          <Button type="submit">
            Crea Utente
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}