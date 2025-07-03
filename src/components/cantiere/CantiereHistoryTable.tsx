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
import { Mail, Printer, RotateCcw, RefreshCcw } from "lucide-react";
import { showInfo, showError } from "@/utils/toast";
import { supabase } from "@/integrations/supabase/client";

interface CantiereReport {
  id: string;
  report_date: string;
  report_time: string;
  client_id: string;
  site_name: string;
  employee_id: string;
  service_provided: string;
  start_datetime?: string | null;
  end_datetime?: string | null;
  notes?: string;
  automezziCount: number;
  attrezziCount: number;
  nome_cliente?: string;
  nome_addetto?: string;
  status?: string; // Added status field
}

export function CantiereHistoryTable() {
  const [data, setData] = useState<CantiereReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDate, setFilterDate] = useState<string>("");

  const fetchCantiereReports = useCallback(async () => {
    setLoading(true);
    const { data: reportsData, error } = await supabase
      .from('registri_cantiere')
      .select('id, report_date, report_time, client_id, site_name, employee_id, service_provided, start_datetime, end_datetime, notes, status, clienti(nome_cliente), addetto:personale!employee_id(nome, cognome)');

    if (error) {
      showError(`Errore nel recupero dei rapporti di cantiere: ${error.message}`);
      console.error("Error fetching registri_cantiere:", error);
      setData([]);
      setLoading(false);
      return;
    }

    const reportsWithCounts = await Promise.all(reportsData.map(async (report) => {
      const { count: automezziCount, error: automezziError } = await supabase
        .from('automezzi_utilizzati')
        .select('id', { count: 'exact', head: true })
        .eq('registro_cantiere_id', report.id);

      const { count: attrezziCount, error: attrezziError } = await supabase
        .from('attrezzi_utilizzati')
        .select('id', { count: 'exact', head: true })
        .eq('registro_cantiere_id', report.id);

      if (automezziError) console.error("Error fetching automezzi count:", automezziError);
      if (attrezziError) console.error("Error fetching attrezzi count:", attrezziError);

      return {
        ...report,
        nome_cliente: report.clienti?.nome_cliente || 'N/A',
        nome_addetto: report.addetto ? `${report.addetto.nome} ${report.addetto.cognome}` : 'N/A',
        automezziCount: automezziCount || 0,
        attrezziCount: attrezziCount || 0,
      };
    }));

    setData(reportsWithCounts || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCantiereReports();
  }, [fetchCantiereReports]);

  const filteredData = useMemo(() => {
    return data.filter(report => {
      const matchesSearch = searchTerm === "" ||
        report.nome_cliente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.site_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.nome_addetto?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.service_provided.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.status?.toLowerCase().includes(searchTerm.toLowerCase()); // Include status in search

      const matchesDate = filterDate === "" ||
        report.report_date === filterDate;

      return matchesSearch && matchesDate;
    });
  }, [data, searchTerm, filterDate]);

  const columns: ColumnDef<CantiereReport>[] = useMemo(() => [
    {
      accessorKey: "report_date",
      header: "Data Rapporto",
      cell: ({ row }) => {
        const date = (row.original.report_date && typeof row.original.report_date === 'string') ? parseISO(row.original.report_date) : null;
        return <span>{date ? format(date, "PPP", { locale: it }) : "N/A"}</span>;
      },
    },
    {
      accessorKey: "nome_cliente",
      header: "Cliente",
      cell: ({ row }) => <span>{row.original.nome_cliente}</span>,
    },
    {
      accessorKey: "site_name",
      header: "Cantiere",
      cell: ({ row }) => <span>{row.original.site_name}</span>,
    },
    {
      accessorKey: "nome_addetto",
      header: "Addetto",
      cell: ({ row }) => <span>{row.original.nome_addetto}</span>,
    },
    {
      accessorKey: "service_provided",
      header: "Servizio",
      cell: ({ row }) => <span>{row.original.service_provided}</span>,
    },
    {
      accessorKey: "start_datetime",
      header: "Inizio Servizio",
      cell: ({ row }) => {
        const date = row.original.start_datetime ? parseISO(row.original.start_datetime) : null;
        return <span>{date ? format(date, "dd/MM/yyyy HH:mm", { locale: it }) : "N/A"}</span>;
      },
    },
    {
      accessorKey: "end_datetime",
      header: "Fine Servizio",
      cell: ({ row }) => {
        const date = row.original.end_datetime ? parseISO(row.original.end_datetime) : null;
        return <span>{date ? format(date, "dd/MM/yyyy HH:mm", { locale: it }) : "N/A"}</span>;
      },
    },
    {
      accessorKey: "status", // New column for status
      header: "Stato",
      cell: ({ row }) => <span>{row.original.status || 'N/A'}</span>,
    },
    {
      id: "actions",
      header: "Azioni",
      cell: ({ row }) => (
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={() => showInfo(`Invio email per CR${row.original.id}`)}>
            <Mail className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => showInfo(`Stampa PDF per CR${row.original.id}`)}>
            <Printer className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => showInfo(`Ripristino dati per CR${row.original.id}`)}>
            <RotateCcw className="h-4 w-4" />
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
          placeholder="Cerca per cliente, cantiere, addetto..."
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
        <Button variant="outline" onClick={fetchCantiereReports} disabled={loading}>
          <RefreshCcw className="mr-2 h-4 w-4" /> {loading ? 'Caricamento...' : 'Aggiorna Dati'}
        </Button>
      </div>
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Caricamento rapporti di cantiere...
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
                  Nessun rapporto di cantiere trovato.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}