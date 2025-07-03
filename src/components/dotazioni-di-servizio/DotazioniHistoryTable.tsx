import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format, parseISO } from "date-fns";
import { it } from 'date-fns/locale';
import { Printer, RefreshCcw } from "lucide-react";
import { showInfo, showError } from "@/utils/toast";
import { supabase } from "@/integrations/supabase/client";

interface DotazioniReport {
  id: string;
  service_date: string;
  employee_id: string;
  service_location: string;
  service_type: string;
  vehicle_make_model: string;
  vehicle_plate: string;
  start_km: number;
  end_km: number;
  // Joined fields
  nome_dipendente?: string;
}

export function DotazioniHistoryTable() {
  const [data, setData] = useState<DotazioniReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDate, setFilterDate] = useState<string>("");

  const fetchDotazioniReports = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('rapporti_servizio')
      .select('*, personale(nome, cognome)')
      .order('service_date', { ascending: false })
      .order('start_time', { ascending: false });

    if (filterDate) {
      query = query.eq('service_date', filterDate);
    }

    const { data: reportsData, error } = await query;

    if (error) {
      showError(`Errore nel recupero dello storico: ${error.message}`);
      console.error("Error fetching rapporti_servizio:", error);
      setData([]);
    } else {
      const mappedData = reportsData.map(report => ({
        ...report,
        nome_dipendente: report.personale ? `${report.personale.nome} ${report.personale.cognome}` : 'N/A',
      }));
      setData(mappedData || []);
    }
    setLoading(false);
  }, [filterDate]);

  useEffect(() => {
    fetchDotazioniReports();
  }, [fetchDotazioniReports]);

  const filteredData = useMemo(() => {
    return data.filter(report => {
      const searchLower = searchTerm.toLowerCase();
      return (
        report.nome_dipendente?.toLowerCase().includes(searchLower) ||
        report.service_location.toLowerCase().includes(searchLower) ||
        report.vehicle_plate.toLowerCase().includes(searchLower) ||
        report.service_type.toLowerCase().includes(searchLower)
      );
    });
  }, [data, searchTerm]);

  const handlePrint = (reportId: string) => {
    showInfo(`La stampa del rapporto ${reportId} non è ancora implementata in questa tabella.`);
  };

  const columns: ColumnDef<DotazioniReport>[] = useMemo(() => [
    {
      accessorKey: "service_date",
      header: "Data Servizio",
      cell: ({ row }) => <span>{format(parseISO(row.original.service_date), "PPP", { locale: it })}</span>,
    },
    {
      accessorKey: "nome_dipendente",
      header: "Dipendente",
    },
    {
      accessorKey: "service_location",
      header: "Punto Servizio",
    },
    {
      accessorKey: "vehicle_plate",
      header: "Targa",
    },
    {
      accessorKey: "start_km",
      header: "KM Inizio",
    },
    {
      accessorKey: "end_km",
      header: "KM Fine",
    },
    {
      id: "actions",
      header: "Azioni",
      cell: ({ row }) => (
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={() => handlePrint(row.original.id)} title="Stampa PDF">
            <Printer className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ], []);

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        <Input
          placeholder="Cerca per dipendente, targa, etc..."
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
        <Button variant="outline" onClick={() => { setSearchTerm(""); setFilterDate(""); }}>
          Reset Filtri
        </Button>
        <Button variant="outline" onClick={() => fetchDotazioniReports()} disabled={loading}>
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
                  Caricamento storico...
                </TableCell>
              </TableRow>
            ) : (table.getRowModel().rows?.length) ? (
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
                  Nessun rapporto trovato.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}