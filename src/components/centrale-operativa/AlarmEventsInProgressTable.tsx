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
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { Printer, RefreshCcw, Edit, MessageSquareText, Trash2, FileText } from 'lucide-react';
import { showInfo, showError, showSuccess } from '@/utils/toast';
import { supabase } from '@/integrations/supabase/client';
import { printSingleServiceReport } from '@/utils/printReport';
import { useNavigate } from 'react-router-dom';
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
  start_latitude?: number;
  start_longitude?: number;
  end_latitude?: number;
  end_longitude?: number;
}

interface PuntoServizioExtended extends PuntoServizio {
  procedure?: Procedure | null;
}

export function AlarmEventsInProgressTable() {
  console.count("AlarmEventsInProgressTable render");
  console.log("VITE_PUBLIC_BASE_URL:", import.meta.env.VITE_PUBLIC_BASE_URL);

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

  const fetchInProgressEvents = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('allarme_interventi')
      .select('*, start_latitude, start_longitude, end_latitude, end_longitude')
      .is('service_outcome', null);

    if (error) {
      showError(`Errore nel recupero degli eventi in gestione: ${error.message}`);
      console.error("Error fetching in-progress alarm events:", error);
      setData([]);
    } else {
      setData(data || []);
    }
    setLoading(false);
  }, []);

  const fetchPattugliaPersonnel = useCallback(async () => {
    const personnel = await fetchPersonale('Pattuglia');
    const map = new Map<string, Personale>();
    personnel.forEach(p => map.set(p.id, p));
    setPattugliaPersonnelMap(map);
  }, []);

  const fetchCoOperatorsPersonnel = useCallback(async () => {
    const personnel = await fetchPersonale('Operatore C.O.');
    const map = new Map<string, Personale>();
    personnel.forEach(p => map.set(p.id, p));
    setCoOperatorsPersonnelMap(map);
  }, []);

  const fetchPuntiServizioData = useCallback(async () => {
    const fetchedPuntiServizio = await fetchPuntiServizio();
    const map = new Map<string, PuntoServizioExtended>();
    fetchedPuntiServizio.forEach(p => {
      map.set(p.id, p);
      if (p.codice_sicep) map.set(p.codice_sicep, p);
      if (p.codice_cliente) map.set(p.codice_cliente, p);
      if (p.nome_punto_servizio) map.set(p.nome_punto_servizio, p);
    });
    setPuntiServizioMap(map);
  }, []);

  useEffect(() => {
    fetchInProgressEvents();
    fetchPattugliaPersonnel();
    fetchCoOperatorsPersonnel();
    fetchPuntiServizioData();
  }, [fetchInProgressEvents, fetchPattugliaPersonnel, fetchCoOperatorsPersonnel, fetchPuntiServizioData]);

  const handleEdit = useCallback((event: AllarmeIntervento) => {
    navigate(`/centrale-operativa/edit/${event.id}`);
  }, [navigate]);

  const handleWhatsAppMessage = useCallback((event: AllarmeIntervento) => {
    console.log("Event object for WhatsApp message:", event);
    console.log("Event ID:", event.id);
    console.log("Event start_latitude:", event.start_latitude);
    console.log("Event start_longitude:", event.start_longitude);

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
        if (event.start_latitude !== undefined && event.start_latitude !== null && event.start_longitude !== undefined && event.start_longitude !== null) {
          gpsLink = `https://www.google.com/maps/search/?api=1&query=${event.start_latitude},${event.start_longitude}`;
        }

        const message = encodeURIComponent(
          `Allarme presso ${servicePointName}. ` +
          `Intervento da effettuarsi ENTRO ${tempoIntervento}. ` +
          `Posizione: ${gpsLink}. ` +
          `Compila rapporto: INTERVENTO ${servicePointName} ${publicEditUrl}`
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
        fetchInProgressEvents();
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
        (report.notes?.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesDate = filterDate === '' ||
        format(new Date(report.report_date), "yyyy-MM-dd") === filterDate;

      return matchesSearch && matchesDate;
    });
  }, [data, searchTerm, filterDate, pattugliaPersonnelMap, puntiServizioMap, coOperatorsPersonnelMap]);

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
  ], [handleEdit, handleWhatsAppMessage, handleDelete, handleViewProcedure, pattugliaPersonnelMap, puntiServizioMap, coOperatorsPersonnelMap]);

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
        <Input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="max-w-xs"
        />
        <Button variant="outline" onClick={() => { setSearchTerm(''); setFilterDate(''); }}>
          Reset Filtri
        </Button>
        <Button variant="outline" onClick={fetchInProgressEvents} disabled={loading}>
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
                  Nessun evento in gestione trovato.
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