import React, { useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
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
import { UserProfile } from '@/lib/anagrafiche-data';
import { appRoutes } from '@/lib/app-routes'; // Import the app routes

interface UserEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  onSave: (updatedUser: UserProfile) => void;
}

const formSchema = z.object({
  first_name: z.string().optional().nullable(),
  last_name: z.string().optional().nullable(),
  role: z.enum(['Amministratore', 'Amministrazione', 'Centrale Operativa', 'Personale esterno'], {
    required_error: "Il ruolo è richiesto.",
  }),
  allowed_routes: z.array(z.string()).optional(), // New field for allowed routes
});

export function UserEditDialog({ isOpen, onClose, user, onSave }: UserEditDialogProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      first_name: null,
      last_name: null,
      role: 'Personale esterno',
      allowed_routes: [], // Initialize as empty array
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        first_name: user.first_name || null,
        last_name: user.last_name || null,
        role: user.role,
        allowed_routes: user.allowed_routes || [], // Populate from user data
      });
    }
  }, [user, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) {
      showError("Nessun utente selezionato per la modifica.");
      onClose();
      return;
    }

    const updatedProfileData = {
      first_name: values.first_name,
      last_name: values.last_name,
      role: values.role,
      allowed_routes: values.allowed_routes, // Save allowed routes
    };

    const { data, error } = await supabase
      .from('profiles')
      .update(updatedProfileData)
      .eq('id', user.id)
      .select();

    if (error) {
      showError(`Errore durante l'aggiornamento del profilo utente: ${error.message}`);
      console.error("Error updating user profile:", error);
    } else {
      showSuccess(`Profilo utente "${user.email}" aggiornato con successo!`);
      onSave({ ...user, ...updatedProfileData });
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifica Utente: {user?.email}</DialogTitle>
          <DialogDescription>
            Apporta modifiche al profilo dell'utente.
          </DialogDescription>
        </DialogHeader>
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
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

            {/* New section for Allowed Routes */}
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
              <Button type="submit">Salva Modifiche</Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}