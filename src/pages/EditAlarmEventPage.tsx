import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
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
  requestTypeOptions,
  operatorClientOptions,
  serviceOutcomeOptions,
} from '@/lib/centrale-options';
import { fetchPersonale, fetchPuntiServizio } from '@/lib/data-fetching';
import { Personale, PuntoServizio } from '@/lib/anagrafiche-data';

interface AllarmeIntervento {
  id: string;
  report_date: string;
  report_time: string;
  service_point_code: string;
  request_type: string;
  co_operator?: string | null;
  operator_client?: string | null;
  gpg_intervention?: string | null;
  service_outcome?: string | null;
  notes?: string | null;
  start_latitude?: number | null; // Nuovo campo
  start_longitude?: number | null; // Nuovo campo
  end_latitude?: number | null;   // Rinomina da latitude
  end_longitude?: number | null;  // Rinomina da longitude
}

const formSchema = z.object({
  report_date: z.date({
    required_error: "La data del rapporto è richiesta.",
  }),
  report_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato ora non valido (HH:MM)."),
  service_point_code: z.string().uuid("Seleziona un punto servizio valido.").nonempty("Il punto servizio è richiesto."),
  request_type: z.string().min(1, "La tipologia di richiesta è richiesta."),
  co_operator: z.string().optional().nullable(),
  operator_client: z.string().optional().nullable(),
  gpg_intervention: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  start_latitude: z.coerce.number().optional().nullable(), // Nuovo campo
  start_longitude: z.coerce.number().optional().nullable(), // Nuovo campo
  end_latitude: z.coerce.number().optional().nullable(),   // Rinomina
  end_longitude: z.coerce.number().optional().nullable(),  // Rinomina
  service_outcome: z.string().optional().nullable(),
});

const EditAlarmEventPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isPublicMode = location.pathname.startsWith('/public/');

  const [eventData, setEventData] = useState<AllarmeIntervento | null>(null);
  const [loadingEvent, setLoadingEvent] = useState(true);
  const [pattugliaPersonale, setPattugliaPersonale] = useState<Personale[]>([]);
  const [puntiServizioList, setPuntiServizioList] = useState<PuntoServizio[]>([]);
  const [coOperatorsPersonnel, setCoOperatorsPersonnel] = useState<Personale[]>([]);

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
      start_latitude: null, // Default per nuovo campo
      start_longitude: null, // Default per nuovo campo
      end_latitude: null,   // Default per rinominato
      end_longitude: null,  // Default per rinominato
      service_outcome: null,
    },
  });

  useEffect(() => {
    const loadPersonnelAndEventData = async () => {
      setLoadingEvent(true);
      const fetchedPattuglia = await fetchPersonale('Pattuglia');
      setPattugliaPersonale(fetchedPattuglia);

      const fetchedPuntiServizio = await fetchPuntiServizio();
      setPuntiServizioList(fetchedPuntiServizio);

      const fetchedCoOperators = await fetchPersonale('Operatore C.O.');
      setCoOperatorsPersonnel(fetchedCoOperators);

      if (id) {
        const { data: event, error } = await supabase
          .from('allarme_interventi')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          showError(`Errore nel recupero dell'evento: ${error.message}`);
          console.error("Error fetching alarm event:", error);
          if (!isPublicMode) {
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
            start_latitude: event.start_latitude || null, // Popola nuovo campo
            start_longitude: event.start_longitude || null, // Popola nuovo campo
            end_latitude: event.end_latitude || null,     // Popola rinominato
            end_longitude: event.end_longitude || null,    // Popola rinominato
            service_outcome: event.service_outcome || null,
          });
        } else {
          showError("Evento non trovato.");
          if (!isPublicMode) {
            navigate('/centrale-operativa?tab=eventi-in-gestione');
          }
        }
      } else {
        showError("ID evento non fornito.");
        if (!isPublicMode) {
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

  const handleStartGpsTracking = () => {
    if (navigator.geolocation) {
      showInfo("Acquisizione posizione GPS inizio intervento...");
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          form.setValue("start_latitude", latitude);
          form.setValue("start_longitude", longitude);
          showSuccess(`Posizione GPS inizio intervento acquisita: Lat ${latitude.toFixed(6)}, Lon ${longitude.toFixed(6)}`);
        },
        (error) => {
          showError(`Errore acquisizione GPS inizio intervento: ${error.message}`);
          console.error("Error getting start GPS position:", error);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      showError("La geolocalizzazione non è supportata dal tuo browser.");
    }
  };

  const handleEndGpsTracking = () => {
    if (navigator.geolocation) {
      showInfo("Acquisizione posizione GPS fine intervento...");
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          form.setValue("end_latitude", latitude);
          form.setValue("end_longitude", longitude);
          showSuccess(`Posizione GPS fine intervento acquisita: Lat ${latitude.toFixed(6)}, Lon ${longitude.toFixed(6)}`);
        },
        (error) => {
          showError(`Errore acquisizione GPS fine intervento: ${error.message}`);
          console.error("Error getting end GPS position:", error);
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
      start_latitude: values.start_latitude, // Includi nuovo campo
      start_longitude: values.start_longitude, // Includi nuovo campo
      end_latitude: values.end_latitude,     // Includi rinominato
      end_longitude: values.end_longitude,    // Includi rinominato
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
          navigate('/public/success');
        } else {
          navigate('/centrale-operativa?tab=eventi-in-gestione');
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
            {!isPublicMode && (
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="start_latitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Latitudine Inizio</FormLabel>
                      <FormControl>
                        <Input type="number" step="any" placeholder="Es: 38.123456" {...field} onChange={e => field.onChange(e.target.valueAsNumber)} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="start_longitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Longitudine Inizio</FormLabel>
                      <FormControl>
                        <Input type="number" step="any" placeholder="Es: 13.123456" {...field} onChange={e => field.onChange(e.target.valueAsNumber)} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Button type="button" className="w-full bg-blue-600 hover:bg-blue-700" onClick={handleStartGpsTracking}>
                ACQUISIZIONE POSIZIONE GPS INIZIO INTERVENTO
              </Button>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="end_latitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Latitudine Fine</FormLabel>
                      <FormControl>
                        <Input type="number" step="any" placeholder="Es: 38.123456" {...field} onChange={e => field.onChange(e.target.valueAsNumber)} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="end_longitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Longitudine Fine</FormLabel>
                      <FormControl>
                        <Input type="number" step="any" placeholder="Es: 13.123456" {...field} onChange={e => field.onChange(e.target.valueAsNumber)} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Button type="button" className="w-full bg-blue-600 hover:bg-blue-700" onClick={handleEndGpsTracking}>
                ACQUISIZIONE POSIZIONE GPS FINE INTERVENTO
              </Button>

              <FormField
                control={form.control}
                name="service_point_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Punto Servizio</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona un punto servizio...">
                            {puntiServizioList.find(p => p.id === field.value)?.nome_punto_servizio || "Seleziona un punto servizio..."}
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {puntiServizioList.map(point => (
                          <SelectItem key={point.id} value={point.id}>
                            {point.nome_punto_servizio}
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
                        {coOperatorsPersonnel.map(personale => (
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
                {!isPublicMode && (
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