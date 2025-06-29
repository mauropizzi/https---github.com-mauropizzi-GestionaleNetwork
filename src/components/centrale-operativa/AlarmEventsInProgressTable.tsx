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
import { Printer, RefreshCcw, Edit, MessageSquareText } from 'lucide-react'; // Import MessageSquareText icon
import { showInfo, showError } from '@/utils/toast';
import { supabase } from '@/integrations/supabase/client';
import { findServicePointByCode } from '@/lib/centrale-data';
import { printSingleServiceReport } from '@/utils/printReport';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import { fetchPersonale } from '@/lib/data-fetching'; // Import fetchPersonale
import { Personale } from '@/lib/anagrafiche-data'; // Import Personale interface

interface AllarmeIntervento {
  id: string;
  report_date: string;
  report_time: string;
  service_point_code: string;
  request_type: string;
  co_operator?: string;
  operator_client?: string;
  gpg_intervention?: string; // This is the personnel ID
  service_outcome?: string; // This should be null for "in progress"
  notes?: string;
  latitude?: number;
  longitude?: number;
}

export function AlarmEventsInProgressTable() {
  console.count("AlarmEventsInProgressTable render");

  const navigate = useNavigate(); // Initialize useNavigate
  const [data, setData] = useState<AllarmeIntervento[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState<string>('');
  const [pattugliaPersonnelMap, setPattugliaPersonnelMap] = useState<Map<string, Personale>>(new Map());

  const fetchInProgressEvents = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('allarme_interventi')
      .select('*')
      .is('service_outcome', null); // Filter for events with no outcome

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

  useEffect(() => {
    fetchInProgressEvents();
    fetchPattugliaPersonnel();
  }, [fetchInProgressEvents, fetchPattugliaPersonnel]);

  const handleEdit = useCallback((event: AllarmeIntervento) => {
    navigate(`/centrale-operativa/edit/${event.id}`); // Navigate to the new edit page
  }, [navigate]);

  const handleWhatsAppMessage = useCallback((event: AllarmeIntervento) => {
    const gpgInterventionId = event.gpg_intervention;
    if (gpgInterventionId) {
      const personnel = pattugliaPersonnelMap.get(gpgInterventionId);
      if (personnel && personnel.telefono) {
        const cleanedPhoneNumber = personnel.telefono.replace(/\D/g, '');
        const publicEditUrl = `${window.location.origin}/public/alarm-event/edit/${event.id}`;
        const message = encodeURIComponent(`Ciao ${personnel.nome}, per favore compila il rapporto di intervento per l'evento ${event.id} al seguente link: ${publicEditUrl}`);
        const whatsappUrl = `https://wa.me/${cleanedPhoneNumber}?text=${message}`;
        window.open(whatsappUrl, '_blank');
        showInfo(`Apertura chat WhatsApp per ${personnel.nome} ${personnel.cognome}`);
      } else {
        showError("Numero di telefono del G.P.G. non disponibile.");
      }
    } else {
      showError("Nessun G.P.G. associato a questo intervento.");
    }
  }, [pattugliaPersonnelMap]);

  const filteredData = useMemo(() => {
    return data.filter(report => {
      const servicePointName = findServicePointByCode(report.service_point_code)?.name || report.service_point_code;
      const matchesSearch = searchTerm === '' ||
        servicePointName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.request_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (report.co_operator?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (report.operator_client?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (report.gpg_intervention && pattugliaPersonnelMap.get(report.gpg_intervention)?.nome?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (report.gpg_intervention && pattugliaPersonnelMap.get(report.gpg_intervention)?.cognome?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (report.notes?.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesDate = filterDate === '' ||
        format(new Date(report.report_date), "yyyy-MM-dd") === filterDate;

      return matchesSearch && matchesDate;
    });
  }, [data, searchTerm, filterDate, pattugliaPersonnelMap]);

  const columns: ColumnDef<AllarmeIntervento>[] = useMemo(() => [
    {
      accessorKey: 'id',
      header: 'ID',
    },
    {
      accessorKey: 'report_date',
      header: 'Data',
      cell: ({ row }) => format(new Date(row.original.report_date), 'PPP', { locale: it }),
    },
    {
      accessorKey: 'report_time',
      header: 'Ora',
    },
    {
      accessorKey: 'service_point_code',
      header: 'Punto Servizio',
      cell: ({ row }) => findServicePointByCode(row.original.service_point_code)?.name || row.original.service_point_code,
    },
    {
      accessorKey: 'request_type',
      header: 'Tipo Richiesta',
    },
    {
      accessorKey: 'co_operator',
      header: 'Operatore C.O.',
    },
    {
      accessorKey: 'gpg_intervention',
      header: 'G.P.G. Intervento',
      cell: ({ row }) => {
        const personnel = pattugliaPersonnelMap.get(row.original.gpg_intervention || '');
        return personnel ? `${personnel.nome} ${personnel.cognome}` : 'N/A';
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
        </div>
      ),
    },
  ], [handleEdit, handleWhatsAppMessage, pattugliaPersonnelMap]);

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowodel(),
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

      <div className="rounded-md border">
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
    </div>
  );
}