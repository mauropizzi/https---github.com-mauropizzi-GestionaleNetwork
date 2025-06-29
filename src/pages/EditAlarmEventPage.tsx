import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom'; // Import useLocation
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { format, parseISO, isValid } from 'date-fns';
import { it } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { showSuccess, showError, showInfo } from "@/utils/toast";
import { supabase } from '@/integrations/supabase/client';
import {
  servicePointsData,
  requestTypeOptions,
  coOperatorOptions,
  operatorClientOptions,
  serviceOutcomeOptions,
} from '@/lib/centrale-data';
import { fetchPersonale } from '@/lib/data-fetching';
import { Personale } from '@/lib/anagrafiche-data';

interface AllarmeIntervento {
  id: string;
  report_date: string; // ISO date string
  report_time: string; // HH:MM:SS string
  service_point_code: string;
  request_type: string;
  co_operator?: string | null;
  operator_client?: string | null;
  gpg_intervention?: string | null;
  service_outcome?: string | null;
  notes?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

const formSchema = z.object({
  report_date: z.date({
    required_error: "La data del rapporto è richiesta.",
  }),
  report_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato ora non valido (HH:MM)."),
  service_point_code: z.string().min(1, "Il punto servizio è richiesto."),
  request_type: z.string().min(1, "La tipologia di richiesta è richiesta."),
  co_operator: z.string().optional().nullable(),
  operator_client: z.string().optional().nullable(),
  gpg_intervention: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  latitude: z.coerce.number().optional().nullable(),
  longitude: z.coerce.number().optional().nullable(),
  service_outcome: z.string().optional().nullable(),
});

const EditAlarmEventPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation(); // Get current location
  const isPublicMode = location.pathname.startsWith('/public/'); // Check if in public mode

  const [eventData, setEventData] = useState<AllarmeIntervento | null>(null);
  const [loadingEvent, setLoadingEvent] = useState(true);
  const [pattugliaPersonale, setPattugliaPersonale] = useState<Personale[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      report_date: new Date(),
      report_time: format(new Date(), 'HH:mm'),
      service_point_code: '',
      request_type: '',
      co_operator: null,
      operator_client: null,
      gpg_intervention: null,
      notes: null,
      latitude: undefined,
      longitude: undefined,
      service_outcome: null,
    },
  });

  useEffect(() => {
    const loadPersonnelAndEventData = async () => {
      setLoadingEvent(true);
      const fetchedPattuglia = await fetchPersonale('Pattuglia');
      setPattugliaPersonale(fetchedPattuglia);

      if (id) {
        const { data: event, error } = await supabase
          .from('allarme_interventi')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          showError(`Errore nel recupero dell'evento: ${error.message}`);
          console.error("Error fetching alarm event:", error);
          if (!isPublicMode) { // Only redirect if not in public mode
            navigate('/centrale-operativa?tab=eventi-in-gestione');
          }
        } else if (event) {
          setEventData(event);
          form.reset({
            report_date: event.report_date ? parseISO(event.report_date) : new Date(),
            report_time: event.report_time || format(new Date(), 'HH:mm'),
            service_point_code: event.service_point_code || '',
            request_type: event.request_type || '',
            co_operator: event.co_operator || null,
            operator_client: event.operator_client || null,
            gpg_intervention: event.gpg_intervention || null,
            notes: event.notes || null,
            latitude: event.latitude || undefined,
            longitude: event.longitude || undefined,
            service_outcome: event.service_outcome || null,
          });
        } else {
          showError("Evento non trovato.");
          if (!isPublicMode) { // Only redirect if not in public mode
            navigate('/centrale-operativa?tab=eventi-in-gestione');
          }
        }
      } else {
        showError("ID evento non fornito.");
        if (!isPublicMode) { // Only redirect if not in public mode
          navigate('/centrale-operativa?tab=eventi-in-gestione');
        }
      }
      setLoadingEvent(false);
    };
    loadPersonnelAndEventData();
  }, [id, navigate, form, isPublicMode]);

  const handleSetCurrentTime = (field: "report_time") => {
    form.setValue(field, format(new Date(), "HH:mm"));
  };

  const handleGpsTracking = () => {
    if (navigator.geolocation) {
      showInfo("Acquisizione posizione GPS...");
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          form.setValue("latitude", latitude);
          form.setValue("longitude", longitude);
          showSuccess(`Posizione GPS acquisita: Lat ${latitude.toFixed(6)}, Lon ${longitude.toFixed(6)}`);
        },
        (error) => {
          showError(`Errore acquisizione GPS: ${error.message}`);
          console.error("Error getting GPS position:", error);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      showError("La geolocalizzazione non è supportata dal tuo browser.");
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!id) {
      showError("ID evento non fornito per l'aggiornamento.");
      return;
    }

    const updatedData = {
      report_date: format(values.report_date, 'yyyy-MM-dd'),
      report_time: values.report_time,
      service_point_code: values.service_point_code,
      request_type: values.request_type,
      co_operator: values.co_operator,
      operator_client: values.operator_client,
      gpg_intervention: values.gpg_intervention,
      service_outcome: values.service_outcome,
      notes: values.notes,
      latitude: values.latitude,
      longitude: values.longitude,
    };

    try {
      const { data, error } = await supabase
        .from('allarme_interventi')
        .update(updatedData)
        .eq('id', id)
        .select();

      if (error) {
        showError(`Errore durante l'aggiornamento dell'evento: ${error.message}`);
        console.error("Supabase update error:", error);
      } else {
        showSuccess(`Evento ${id} aggiornato con successo!`);
        if (isPublicMode) {
          navigate('/public/success'); // Redirect to public success page
        } else {
          navigate('/centrale-operativa?tab=eventi-in-gestione'); // Redirect back to the list
        }
      }
    } catch (err: any) {
      showError(`Si è verificato un errore di rete durante l'aggiornamento: ${err.message}`);
      console.error("Network or unexpected error during update:", err);
    }
  };

  if (loadingEvent) {
    return (
      <div className="container mx-auto p-4 text-center">
        <Card className="w-full max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center">Caricamento Evento...</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Caricamento dei dettagli dell'evento di allarme. Attendere prego.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!eventData) {
    return (
      <div className="container mx-auto p-4 text-center">
        <Card className="w-full max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center">Evento Non Trovato</CardTitle>
          </CardHeader>
          <CardContent>
            <p>L'evento di allarme richiesto non è stato trovato o l'ID non è valido.</p>
            {!isPublicMode && ( // Only show button if not in public mode
              <Button onClick={() => navigate('/centrale-operativa?tab=eventi-in-gestione')} className="mt-4">
                Torna agli Eventi in Gestione
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">Modifica Evento Allarme: {id}</CardTitle>
          <CardDescription className="text-center">Apporta modifiche ai dettagli dell'evento.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="report_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data Rapporto</FormLabel>
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
                          selected={field.value}
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
                name="report_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ora Rapporto (HH:MM)</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input type="time" placeholder="HH:MM" {...field} />
                      </FormControl>
                      <Button type="button" variant="outline" onClick={() => handleSetCurrentTime('report_time')}>
                        Ora Attuale
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="button" className="w-full bg-blue-600 hover:bg-blue-700" onClick={handleGpsTracking}>
                ACQUISIZIONE POSIZIONE GPS
              </Button>
              {form.watch("latitude") !== undefined && form.watch("longitude") !== undefined && (
                <p className="text-sm text-gray-500 mt-1 text-center">
                  Latitudine: {form.watch("latitude")?.toFixed(6)}, Longitudine: {form.watch("longitude")?.toFixed(6)}
                </p>
              )}
              <FormField
                control={form.control}
                name="service_point_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Punto Servizio</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona un punto servizio..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {servicePointsData.map(point => (
                          <SelectItem key={point.code} value={point.code}>
                            {point.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="request_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipologia Richiesta</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona tipologia richiesta..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {requestTypeOptions.map(option => (
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
                control={form.control}
                name="co_operator"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Operatore C.O. Security Service</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona operatore..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {coOperatorOptions.map(option => (
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
                control={form.control}
                name="operator_client"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Operatore Cliente</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona operatore cliente..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {operatorClientOptions.map(option => (
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
                control={form.control}
                name="gpg_intervention"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>G.P.G. Intervento</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona G.P.G. intervento..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {pattugliaPersonale.map(personale => (
                          <SelectItem key={personale.id} value={personale.id}>
                            {personale.nome} {personale.cognome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="service_outcome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Esito Evento</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona esito..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {serviceOutcomeOptions.map(option => (
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
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Note</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Aggiungi note..." {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                {!isPublicMode && ( // Only show "Annulla" button if not in public mode
                  <Button type="button" variant="outline" onClick={() => navigate('/centrale-operativa?tab=eventi-in-gestione')}>
                    Annulla
                  </Button>
                )}
                <Button type="submit">Salva Modifiche</Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditAlarmEventPage;