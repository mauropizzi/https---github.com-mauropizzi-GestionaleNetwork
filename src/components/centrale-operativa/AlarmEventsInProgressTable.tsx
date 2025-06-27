import React, { useState, useEffect } from 'react';
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
import { Eye, Printer, RefreshCcw, Edit } from 'lucide-react'; // Import Edit icon
import { showInfo, showError } from '@/utils/toast';
import { supabase } from '@/integrations/supabase/client';
import { findServicePointByCode } from '@/lib/centrale-data';
import { printSingleServiceReport } from '@/utils/printReport';
import { EditInterventionDialog } from './EditInterventionDialog'; // Import the new dialog

interface AllarmeIntervento {
  id: string;
  report_date: string;
  report_time: string;
  service_point_code: string;
  request_type: string;
  co_operator?: string;
  operator_client?: string;
  gpg_intervention?: string;
  service_outcome?: string; // This should be null for "in progress"
  notes?: string;
  latitude?: number;
  longitude?: number;
}

export function AlarmEventsInProgressTable() {
  const [data, setData] = useState<AllarmeIntervento[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState<string>('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<AllarmeIntervento | null>(null);

  const fetchInProgressEvents = async () => {
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
  };

  useEffect(() => {
    fetchInProgressEvents();
  }, []);

  const handleEdit = (event: AllarmeIntervento) => {
    console.log("AlarmEventsInProgressTable: handleEdit called with event:", event);
    // Create a shallow copy to ensure the reference is stable until a new edit is triggered
    setSelectedEvent({ ...event }); 
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = (updatedEvent: AllarmeIntervento) => {
    setData(prevData =>
      prevData.map(event =>
        event.id === updatedEvent.id ? updatedEvent : event
      )
    );
    console.log("Evento aggiornato (simulato):", updatedEvent);
    setIsEditDialogOpen(false);
    setSelectedEvent(null); // Ensure selectedEvent is cleared after saving
    fetchInProgressEvents(); // Re-fetch to ensure data consistency and filter out completed events
  };

  const filteredData = data.filter(report => {
    const servicePointName = findServicePointByCode(report.service_point_code)?.name || report.service_point_code;
    const matchesSearch = searchTerm === '' ||
      servicePointName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.request_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (report.co_operator?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (report.operator_client?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (report.gpg_intervention?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (report.notes?.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesDate = filterDate === '' ||
      format(new Date(report.report_date), "yyyy-MM-dd") === filterDate;

    return matchesSearch && matchesDate;
  });

  const columns: ColumnDef<AllarmeIntervento>[] = [
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
        </div>
      ),
    },
  ];

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
            ) : table.getRowModel().rows?.length ? (
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

      {selectedEvent && (
        <EditInterventionDialog
          key={selectedEvent.id} // Added key prop here
          isOpen={isEditDialogOpen}
          onClose={() => {
            setIsEditDialogOpen(false);
            setSelectedEvent(null); // Clear selected event on dialog close
          }}
          event={selectedEvent}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
}