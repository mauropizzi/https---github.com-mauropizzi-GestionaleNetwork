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
import { RefreshCcw } from 'lucide-react';
import { showInfo, showError } from '@/utils/toast';
import { supabase } from '@/integrations/supabase/client';
import { fetchPuntiServizio } from '@/lib/data-fetching';
import { PuntoServizio } from '@/lib/anagrafiche-data';

interface Intervention {
  id: string;
  report_date: string;
  report_time: string;
  service_point_code: string; // This will now consistently be the UUID
  request_type: string;
  co_operator?: string;
  operator_client?: string;
  gpg_intervention?: string;
  service_outcome?: string;
  notes?: string;
}

export function InterventionListTable() {
  const [data, setData] = useState<Intervention[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState<string>('');
  const [puntiServizioMap, setPuntiServizioMap] = useState<Map<string, PuntoServizio>>(new Map());

  const fetchInterventionHistory = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('allarme_interventi')
      .select('*')
      .not('service_outcome', 'is', null); // Fetch only completed events

    if (error) {
      showError(`Errore nel recupero dello storico interventi: ${error.message}`);
      console.error("Error fetching intervention history:", error);
      setData([]);
    } else {
      setData(data || []);
    }
    setLoading(false);
  }, []);

  const fetchPuntiServizioData = useCallback(async () => {
    const fetchedPuntiServizio = await fetchPuntiServizio();
    const map = new Map<string, PuntoServizio>();
    fetchedPuntiServizio.forEach(p => {
      map.set(p.id, p); // Map by ID
      if (p.codice_sicep) map.set(p.codice_sicep, p);
      if (p.codice_cliente) map.set(p.codice_cliente, p);
      if (p.nome_punto_servizio) map.set(p.nome_punto_servizio, p);
    });
    setPuntiServizioMap(map);
  }, []);

  useEffect(() => {
    fetchInterventionHistory();
    fetchPuntiServizioData();
  }, [fetchInterventionHistory, fetchPuntiServizioData]);

  const filteredData = useMemo(() => {
    return data.filter(report => {
      const servicePoint = puntiServizioMap.get(report.service_point_code); // Lookup by ID
      const servicePointName = servicePoint?.nome_punto_servizio || report.service_point_code; // Fallback to ID if name not found
      const matchesSearch = searchTerm === '' ||
        servicePointName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.request_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (report.co_operator?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (report.operator_client?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (report.gpg_intervention?.toLowerCase().includes(searchTerm.toLowerCase())) || // Assuming GPG intervention is a name string here
        (report.notes?.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesDate = filterDate === '' ||
        format(new Date(report.report_date), "yyyy-MM-dd") === filterDate;

      return matchesSearch && matchesDate;
    });
  }, [data, searchTerm, filterDate, puntiServizioMap]);

  const columns: ColumnDef<Intervention>[] = useMemo(() => [
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
      cell: ({ row }) => {
        const servicePoint = puntiServizioMap.get(row.original.service_point_code); // Lookup by ID
        return servicePoint?.nome_punto_servizio || row.original.service_point_code; // Fallback to ID if name not found
      },
    },
    {
      accessorKey: 'request_type',
      header: 'Tipo Richiesta',
    },
    {
      accessorKey: 'service_outcome',
      header: 'Esito',
    },
  ], [puntiServizioMap]);

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <Input
          placeholder="Cerca per ID..."
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
        <Button variant="outline" onClick={fetchInterventionHistory} disabled={loading}>
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
                  Caricamento storico interventi...
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
                  Nessun intervento trovato.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}