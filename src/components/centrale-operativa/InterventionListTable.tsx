import React, { useState, useMemo } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO, isValid } from "date-fns";
import { it } from 'date-fns/locale';
import { CalendarIcon, Mail, Printer, Download, RotateCcw, FileText } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { sendEmail } from "@/utils/email";
import { exportTableToExcel } from "@/utils/export";
import { printTable } from "@/utils/print";
import { showInfo, showSuccess } from "@/utils/toast";
import { printSingleServiceReport } from "@/utils/printReport";
import {
  servicePointsData,
  requestTypeOptions,
  coOperatorOptions,
  operatorClientOptions,
  gpgInterventionOptions,
  serviceOutcomeOptions,
} from "@/lib/centrale-data";

// Define the structure of an alarm intervention from Supabase
interface AllarmeIntervento {
  id: string;
  created_at: string;
  report_date: string; // ISO date string
  report_time: string; // HH:MM:SS string
  service_point_code: string;
  request_type: string;
  co_operator: string | null;
  operator_client: string | null;
  gpg_intervention: string | null;
  service_outcome: string | null;
  notes: string | null;
}

const fetchInterventions = async (): Promise<AllarmeIntervento[]> => {
  const { data, error } = await supabase
    .from('allarme_interventi') // Fetch from the correct table
    .select('*');

  if (error) {
    console.error("Error fetching alarm interventions:", error);
    throw new Error(error.message);
  }
  return data;
};

export function InterventionListTable() {
  const [globalFilter, setGlobalFilter] = useState("");
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined); // Single date filter
  const [servicePointFilter, setServicePointFilter] = useState<string>("all");
  const [requestTypeFilter, setRequestTypeFilter] = useState<string>("all");
  const [coOperatorFilter, setCoOperatorFilter] = useState<string>("all");
  const [operatorClientFilter, setOperatorClientFilter] = useState<string>("all");
  const [gpgInterventionFilter, setGpgInterventionFilter] = useState<string>("all");
  const [serviceOutcomeFilter, setServiceOutcomeFilter] = useState<string>("all");

  const { data, isLoading, error, refetch } = useQuery<AllarmeIntervento[], Error>({
    queryKey: ['allarmeInterventi'],
    queryFn: fetchInterventions,
  });

  const columns: ColumnDef<AllarmeIntervento>[] = useMemo(() => [
    {
      accessorKey: "id",
      header: "ID",
    },
    {
      accessorKey: "report_date",
      header: "Data",
      cell: ({ row }) => format(new Date(row.original.report_date), "dd/MM/yyyy", { locale: it }),
    },
    {
      accessorKey: "report_time",
      header: "Ora",
    },
    {
      accessorKey: "service_point_code",
      header: "Punto Servizio",
      cell: ({ row }) => {
        const point = servicePointsData.find(sp => sp.code === row.original.service_point_code);
        return point ? point.name : row.original.service_point_code || "N/A";
      },
    },
    {
      accessorKey: "request_type",
      header: "Tipologia Richiesta",
    },
    {
      accessorKey: "co_operator",
      header: "Co-Operatore",
      cell: ({ row }) => row.original.co_operator || "N/A",
    },
    {
      accessorKey: "operator_client",
      header: "Operatore Cliente",
      cell: ({ row }) => row.original.operator_client || "N/A",
    },
    {
      accessorKey: "gpg_intervention",
      header: "G.P.G. Intervento",
      cell: ({ row }) => row.original.gpg_intervention || "N/A",
    },
    {
      accessorKey: "service_outcome",
      header: "Esito Servizio",
      cell: ({ row }) => row.original.service_outcome || "N/A",
    },
    {
      accessorKey: "notes",
      header: "Note",
    },
    {
      id: "actions",
      header: "Azioni",
      cell: ({ row }) => (
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={() => printSingleServiceReport(row.original.id)}>
            <FileText className="h-4 w-4 mr-1" /> Dettagli/Stampa
          </Button>
        </div>
      ),
    },
  ], []);

  const filteredData = useMemo(() => {
    if (!data) return [];

    return data.filter(item => {
      const itemReportDate = parseISO(item.report_date);

      const matchesDate = !dateFilter || (isValid(itemReportDate) && format(itemReportDate, "yyyy-MM-dd") === format(dateFilter, "yyyy-MM-dd"));
      const matchesServicePoint = servicePointFilter === "all" || item.service_point_code === servicePointFilter;
      const matchesRequestType = requestTypeFilter === "all" || item.request_type === requestTypeFilter;
      const matchesCoOperator = coOperatorFilter === "all" || item.co_operator === coOperatorFilter;
      const matchesOperatorClient = operatorClientFilter === "all" || item.operator_client === operatorClientFilter;
      const matchesGpgIntervention = gpgInterventionFilter === "all" || item.gpg_intervention === gpgInterventionFilter;
      const matchesServiceOutcome = serviceOutcomeFilter === "all" || item.service_outcome === serviceOutcomeFilter;

      const matchesGlobalFilter = globalFilter === "" ||
        Object.values(item).some(value =>
          String(value).toLowerCase().includes(globalFilter.toLowerCase())
        );

      return matchesDate && matchesServicePoint && matchesRequestType &&
             matchesCoOperator && matchesOperatorClient && matchesGpgIntervention &&
             matchesServiceOutcome && matchesGlobalFilter;
    });
  }, [
    data,
    globalFilter,
    dateFilter,
    servicePointFilter,
    requestTypeFilter,
    coOperatorFilter,
    operatorClientFilter,
    gpgInterventionFilter,
    serviceOutcomeFilter
  ]);

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
  });

  const handleResetFilters = () => {
    setGlobalFilter("");
    setDateFilter(undefined);
    setServicePointFilter("all");
    setRequestTypeFilter("all");
    setCoOperatorFilter("all");
    setOperatorClientFilter("all");
    setGpgInterventionFilter("all");
    setServiceOutcomeFilter("all");
    showSuccess("Filtri resettati!");
  };

  const handleExport = () => {
    exportTableToExcel(filteredData, "interventi_allarme", "Interventi Allarme");
  };

  const handlePrint = () => {
    // Prepare columns for printTable, ensuring headers match the displayed table
    const printColumns = columns.filter(col => col.id !== 'actions').map(col => ({
      header: typeof col.header === 'string' ? col.header : col.id,
      accessorKey: col.accessorKey,
    }));

    // Prepare data for printTable, mapping complex cells to simple strings
    const printData = filteredData.map(row => {
      const newRow: { [key: string]: any } = {};
      printColumns.forEach(col => {
        if (col.accessorKey === 'report_date') {
          newRow[col.accessorKey] = format(new Date(row.report_date), "dd/MM/yyyy", { locale: it });
        } else if (col.accessorKey === 'service_point_code') {
          const point = servicePointsData.find(sp => sp.code === row.service_point_code);
          newRow[col.accessorKey] = point ? point.name : row.service_point_code || "N/A";
        } else {
          newRow[col.accessorKey] = (row as any)[col.accessorKey] || "N/A";
        }
      });
      return newRow;
    });

    printTable(printColumns, printData, "Rapporto Interventi Allarme");
  };

  const handleEmail = () => {
    const subject = "Rapporto Interventi Centrale Operativa";
    const body = `Ciao,
    
    In allegato trovi il rapporto degli interventi su allarme filtrati dalla Centrale Operativa.
    
    Totale interventi visualizzati: ${filteredData.length}
    
    Cordiali saluti,
    Il tuo sistema di gestione`;
    sendEmail(subject, body);
  };

  if (isLoading) {
    return <div className="text-center py-8">Caricamento interventi...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">Errore nel caricamento degli interventi: {error.message}</div>;
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <Input
            placeholder="Cerca in tutti i campi..."
            value={globalFilter ?? ""}
            onChange={(event) => setGlobalFilter(event.target.value)}
            className="max-w-sm flex-grow"
          />
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-[200px] justify-start text-left font-normal",
                  !dateFilter && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateFilter ? format(dateFilter, "PPP", { locale: it }) : <span>Seleziona Data</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateFilter}
                onSelect={setDateFilter}
                initialFocus
                locale={it}
              />
            </PopoverContent>
          </Popover>

          <Select onValueChange={setServicePointFilter} value={servicePointFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Punto Servizio" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti i Punti Servizio</SelectItem>
              {servicePointsData.map((point) => (
                <SelectItem key={point.code} value={point.code}>
                  {point.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select onValueChange={setRequestTypeFilter} value={requestTypeFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Tipologia Richiesta" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutte le Tipologie</SelectItem>
              {requestTypeOptions.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select onValueChange={setCoOperatorFilter} value={coOperatorFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Co-Operatore" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti i Co-Operatori</SelectItem>
              {coOperatorOptions.map((op) => (
                <SelectItem key={op} value={op}>
                  {op}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select onValueChange={setOperatorClientFilter} value={operatorClientFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Operatore Cliente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti gli Operatori Cliente</SelectItem>
              {operatorClientOptions.map((op) => (
                <SelectItem key={op} value={op}>
                  {op}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select onValueChange={setGpgInterventionFilter} value={gpgInterventionFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="G.P.G. Intervento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti i G.P.G.</SelectItem>
              {gpgInterventionOptions.map((gpg) => (
                <SelectItem key={gpg} value={gpg}>
                  {gpg}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select onValueChange={setServiceOutcomeFilter} value={serviceOutcomeFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Esito Servizio" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti gli Esiti</SelectItem>
              {serviceOutcomeOptions.map((outcome) => (
                <SelectItem key={outcome} value={outcome}>
                  {outcome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button onClick={handleResetFilters} variant="outline" className="flex-shrink-0">
            <RotateCcw className="mr-2 h-4 w-4" /> Reset Filtri
          </Button>
        </div>

        <div className="flex justify-end space-x-2 mb-4">
          <Button onClick={handleEmail} variant="outline">
            <Mail className="mr-2 h-4 w-4" /> Invia Email
          </Button>
          <Button onClick={handlePrint} variant="outline">
            <Printer className="mr-2 h-4 w-4" /> Stampa PDF
          </Button>
          <Button onClick={handleExport} variant="outline">
            <Download className="mr-2 h-4 w-4" /> Esporta Excel
          </Button>
        </div>

        <div className="rounded-md border">
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
                </TableHead>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
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
    </>
  );
}