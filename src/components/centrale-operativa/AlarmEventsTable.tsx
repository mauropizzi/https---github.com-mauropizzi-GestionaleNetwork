"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { format, parseISO, subWeeks } from 'date-fns';
import { it } from 'date-fns/locale';
import { Mail, Printer, RotateCcw, RefreshCcw, Edit, MessageSquareText, Trash2, FileText } from 'lucide-react';
import { showInfo, showError, showSuccess } from '@/utils/toast';
import { supabase } from '@/integrations/supabase/client';
import { generateSingleServiceReportPdfBlob, printSingleServiceReport } from '@/utils/printReport';
import { useNavigate } from 'react-router-dom';
import { sendEmail } from '@/utils/email';
import { fetchPersonale, fetchPuntiServizio } from '@/lib/data-fetching';
import { Personale, PuntoServizio, Procedure } from '@/lib/anagrafiche-data';
import { ProcedureDetailsDialog } from '@/components/anagrafiche/ProcedureDetailsDialog';

interface AllarmeIntervento {
  id: string;
  report_date: string;
  report_time: string;
  service_point_code: string;
  request_type: string;
  co_operator?: string;
  operator_client?: string;
  gpg_intervention?: string;
  service_outcome?: string;
  notes?: string;
  barcode?: string;
  start_latitude?: number;
  start_longitude?: number;
  end_latitude?: number;
  end_longitude?: number;
}

interface PuntoServizioExtended extends PuntoServizio {
  procedure?: Procedure | null;
}

interface AlarmEventsTableProps {
  type: 'in-progress' | 'history';
}

export function AlarmEventsTable({ type }: AlarmEventsTableProps) {
  const navigate = useNavigate();
  const [data, setData] = useState<AllarmeIntervento[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState<string>('');

  const [pattugliaPersonnelMap, setPattugliaPersonnelMap] = useState<Map<string, Personale>>(new Map());
  const [puntiServizioMap, setPuntiServizioMap] = useState<Map<string, PuntoServizioExtended>>(new Map());
  const [coOperatorsPersonnelMap, setCoOperatorsPersonnelMap] = useState<Map<string, Personale>>(new Map());

  const [isProcedureDetailsDialogOpen, setIsProcedureDetailsDialogOpen] = useState(false);
  const [selectedProcedureForDetails, setSelectedProcedureForDetails] = useState<Procedure | null>(null);

  const fetchEvents = useCallback(async (initialLoad = false) => {
    setLoading(true);
    let query = supabase
      .from('allarme_interventi')
      .select('id, report_date, report_time, service_point_code, request_type, co_operator, operator_client, gpg_intervention, service_outcome, notes, barcode, start_latitude, start_longitude, end_latitude, end_longitude')
      .order('report_date', { ascending: false })
      .order('report_time', { ascending: false });

    if (type === 'in-progress') {
      query = query.is('service_outcome', null);
    } else { // type === 'history'
      query = query.not('service_outcome', 'is', null);
      if (initialLoad) {
        const oneWeekAgo = format(subWeeks(new Date(), 1), 'yyyy-MM-dd');
        query = query.gte('report_date', oneWeekAgo);
      } else if (filterDate) {
        query = query.eq('report_date', filterDate);
      }
    }

    const { data, error } = await query;

    if (error) {
      showError(`Errore nel recupero degli eventi: ${error.message}`);
      console.error("Error fetching alarm events:", error);
      setData([]);
    } else {
      setData(data || []);
    }
    setLoading(false);
  }, [type, filterDate]);

  const fetchPersonnelAndServicePoints = useCallback(async () => {
    const [personnelPattuglia, personnelCo, servicePoints] = await Promise.all([
      fetchPersonale('Pattuglia'),
      fetchPersonale('Operatore C.O.'),
      fetchPuntiServizio(),
    ]);

    const mapPattuglia = new Map<string, Personale>();
    personnelPattuglia.forEach(p => mapPattuglia.set(p.id, p));
    setPattugliaPersonnelMap(mapPattuglia);

    const mapCo = new Map<string, Personale>();
    personnelCo.forEach(p => mapCo.set(p.id, p));
    setCoOperatorsPersonnelMap(mapCo);

    const mapPuntiServizio = new Map<string, PuntoServizioExtended>();
    servicePoints.forEach(p => {
      mapPuntiServizio.set(p.id, p);
      if (p.codice_sicep) mapPuntiServizio.set(p.codice_sicep, p);
      if (p.codice_cliente) mapPuntiServizio.set(p.codice_cliente, p);
      if (p.nome_punto_servizio) mapPuntiServizio.set(p.nome_punto_servizio, p);
    });
    setPuntiServizioMap(mapPuntiServizio);
  }, []);

  useEffect(() => {
    fetchPersonnelAndServicePoints();
  }, [fetchPersonnelAndServicePoints]);

  useEffect(() => {
    fetchEvents(true); // Initial fetch
  }, [fetchEvents]);

  const handleEdit = useCallback((event: AllarmeIntervento) => {
    navigate(`/centrale-operativa/edit/${event.id}`);
  }, [navigate]);

  const handleWhatsAppMessage = useCallback((event: AllarmeIntervento) => {
    const gpgInterventionId = event.gpg_intervention;
    if (gpgInterventionId) {
      const personnel = pattugliaPersonnelMap.get(gpgInterventionId);
      const servicePoint = puntiServizioMap.get(event.service_point_code);

      if (personnel && personnel.telefono) {
        const cleanedPhoneNumber = personnel.telefono.replace(/\D/g, '');
        const publicBaseUrl = import.meta.env.VITE_PUBLIC_BASE_URL || window.location.origin;
        const publicEditUrl = `${publicBaseUrl}/public/alarm-event/edit/${event.id}`;
        const servicePointName = servicePoint?.nome_punto_servizio || event.service_point_code;
        const tempoIntervento = servicePoint?.tempo_intervento !== undefined && servicePoint?.tempo_intervento !== null ? `${servicePoint.tempo_intervento} minuti` : 'N/A';
        
        let gpsLink = 'Posizione non disponibile';
        if (servicePoint?.latitude !== undefined && servicePoint?.latitude !== null && servicePoint?.longitude !== undefined && servicePoint?.longitude !== null) {
          gpsLink = `https://www.google.com/maps/search/?api=1&query=${servicePoint.latitude},${servicePoint.longitude}`;
        }

        const message = encodeURIComponent(
          `Allarme presso ${servicePointName}.\n` +
          `Intervento da effettuarsi ENTRO ${tempoIntervento}.\n\n` +
          `📍 Posizione: ${gpsLink}\n` +
          `📝 Compila rapporto: ${publicEditUrl}`
        );
        
        const whatsappUrl = `https://wa.me/${cleanedPhoneNumber}?text=${message}`;
        window.open(whatsappUrl, '_blank');
        showInfo(`Apertura chat WhatsApp per ${personnel.nome} ${personnel.cognome}`);
      } else {
        showError("Numero di telefono del G.P.G. non disponibile.");
      }
    } else {
      showError("Nessun G.P.G. associato a questo intervento.");
    }
  }, [pattugliaPersonnelMap, puntiServizioMap]);

  const handleEmailReport = useCallback(async (event: AllarmeIntervento) => {
    showInfo("Generazione PDF per l'allegato email...");
    const pdfBlob = await generateSingleServiceReportPdfBlob(event.id);

    if (pdfBlob) {
      const reader = new FileReader();
      reader.readAsDataURL(pdfBlob);
      reader.onloadend = () => {
        const base64data = reader.result?.toString().split(',')[1];
        if (base64data) {
          const servicePoint = puntiServizioMap.get(event.service_point_code);
          const servicePointName = servicePoint?.nome_punto_servizio || event.service_point_code;
          const subject = `Rapporto Intervento Allarme - ${servicePointName} - ${format(new Date(event.report_date), 'dd/MM/yyyy')}`;
          const textBody = `Si trasmette in allegato il rapporto di intervento per l'evento di allarme con ID ${event.id}.\n\nCordiali saluti.`;
          
          sendEmail(subject, textBody, false, {
            filename: `Rapporto_Allarme_${event.id}.pdf`,
            content: base64data,
            contentType: 'application/pdf'
          });
        } else {
          showError("Errore nella conversione del PDF in Base64.");
        }
      };
      reader.onerror = () => {
        showError("Errore nella lettura del file PDF.");
      };
    } else {
      showError("Impossibile generare il PDF per l'allegato.");
    }
  }, [puntiServizioMap]);

  const handleViewProcedure = useCallback((servicePointCode: string) => {
    const servicePoint = puntiServizioMap.get(servicePointCode);
    if (servicePoint && servicePoint.procedure) {
      setSelectedProcedureForDetails(servicePoint.procedure);
      setIsProcedureDetailsDialogOpen(true);
    } else {
      showInfo("Nessuna procedura associata a questo punto servizio o dettagli non disponibili.");
    }
  }, [puntiServizioMap]);

  const handleDelete = async (eventId: string) => {
    if (window.confirm(`Sei sicuro di voler eliminare l'evento di allarme con ID ${eventId}?`)) {
      const { error } = await supabase
        .from('allarme_interventi')
        .delete()
        .eq('id', eventId);

      if (error) {
        showError(`Errore durante l'eliminazione dell'evento: ${error.message}`);
        console.error("Error deleting alarm event:", error);
      } else {
        showSuccess(`Evento ${eventId} eliminato con successo!`);
        fetchEvents();
      }
    } else {
      showInfo(`Eliminazione dell'evento ${eventId} annullata.`);
    }
  };

  const filteredData = useMemo(() => {
    return data.filter(report => {
      const servicePoint = puntiServizioMap.get(report.service_point_code);
      const servicePointName = servicePoint?.nome_punto_servizio || report.service_point_code;
      const coOperatorName = coOperatorsPersonnelMap.get(report.co_operator || '')?.nome || '';
      const matchesSearch = searchTerm === '' ||
        servicePointName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.request_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        coOperatorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (report.operator_client?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (report.gpg_intervention && pattugliaPersonnelMap.get(report.gpg_intervention)?.nome?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (report.gpg_intervention && pattugliaPersonnelMap.get(report.gpg_intervention)?.cognome?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (report.notes?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (report.barcode?.toLowerCase().includes(searchTerm.toLowerCase()));

      return matchesSearch;
    });
  }, [data, searchTerm, pattugliaPersonnelMap, puntiServizioMap, coOperatorsPersonnelMap]);

  const columns: ColumnDef<AllarmeIntervento>[] = useMemo(() => [
    {
      accessorKey: 'report_date',
      header: 'Data',
      cell: ({ row }) => <span>{format(new Date(row.original.report_date), 'PPP', { locale: it })}</span>,
    },
    {
      accessorKey: 'report_time',
      header: 'Ora',
      cell: ({ row }) => <span>{row.original.report_time}</span>,
    },
    {
      accessorKey: 'service_point_code',
      header: 'Punto Servizio',
      cell: ({ row }) => {
        const servicePoint = puntiServizioMap.get(row.original.service_point_code);
        return <span>{servicePoint?.nome_punto_servizio || row.original.service_point_code}</span>;
      },
    },
    {
      accessorKey: 'request_type',
      header: 'Tipo Richiesta',
      cell: ({ row }) => <span>{row.original.request_type}</span>,
    },
    {
      accessorKey: 'co_operator',
      header: 'Operatore C.O.',
      cell: ({ row }) => {
        const personnel = coOperatorsPersonnelMap.get(row.original.co_operator || '');
        return <span>{personnel ? `${personnel.nome} ${personnel.cognome || ''}` : 'N/A'}</span>;
      },
    },
    {
      accessorKey: 'gpg_intervention',
      header: 'G.P.G. Intervento',
      cell: ({ row }) => {
        const personnel = pattugliaPersonnelMap.get(row.original.gpg_intervention || '');
        return <span>{personnel ? `${personnel.nome} ${personnel.cognome}` : 'N/A'}</span>;
      },
    },
    ...(type === 'history' ? [{
      accessorKey: 'service_outcome',
      header: 'Esito',
      cell: ({ row }) => <span>{row.original.service_outcome || 'N/A'}</span>,
    }] : []),
    {
      accessorKey: 'barcode',
      header: 'Barcode',
      cell: ({ row }) => <span>{row.original.barcode || 'N/A'}</span>,
    },
    {
      id: 'actions',
      header: 'Azioni',
      cell: ({ row }) => (
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={() => handleEdit(row.original)} title="Modifica">
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => printSingleServiceReport(row.original.id)} title="Stampa PDF">
            <Printer className="h-4 w-4" />
          </Button>
          {type === 'history' && (
            <Button variant="outline" size="sm" onClick={() => handleEmailReport(row.original)} title="Invia Email">
              <Mail className="h-4 w-4" />
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => handleWhatsAppMessage(row.original)} title="Invia WhatsApp">
            <MessageSquareText className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleViewProcedure(row.original.service_point_code)} 
            title="Visualizza Procedura"
          >
            <FileText className="h-4 w-4" />
          </Button>
          <Button variant="destructive" size="sm" onClick={() => handleDelete(row.original.id)} title="Elimina">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ], [handleEdit, handleWhatsAppMessage, handleDelete, handleViewProcedure, handleEmailReport, pattugliaPersonnelMap, puntiServizioMap, coOperatorsPersonnelMap, type]);

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        <Input
          placeholder="Cerca per punto servizio, tipo richiesta..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        {type === 'history' && (
          <Input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="max-w-xs"
          />
        )}
        <Button variant="outline" onClick={() => { setSearchTerm(''); setFilterDate(''); fetchEvents(true); }}>
          Reset Filtri
        </Button>
        <Button variant="outline" onClick={() => fetchEvents(false)} disabled={loading}>
          <RefreshCcw className="mr-2 h-4 w-4" /> {loading ? 'Caricamento...' : 'Aggiorna Dati'}
        </Button>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Caricamento eventi...
                </TableCell>
              </TableRow>
            ) : (table && table.getRowModel().rows?.length) ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Nessun evento trovato.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {selectedProcedureForDetails && (
        <ProcedureDetailsDialog
          isOpen={isProcedureDetailsDialogOpen}
          onClose={() => setIsProcedureDetailsDialogOpen(false)}
          procedure={selectedProcedureForDetails}
        />
      )}
    </div>
  );
}