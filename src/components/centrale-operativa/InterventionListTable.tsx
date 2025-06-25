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
import { CalendarIcon, Mail, Printer, Download, RotateCcw } from "lucide-react";
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
import {
  servicePointsData,
  requestTypeOptions,
  coOperatorOptions,
  operatorClientOptions,
  gpgInterventionOptions,
  serviceOutcomeOptions,
} from "@/lib/centrale-data";

// Define the structure of a service request from Supabase
interface ServiziRichiesti {
  id: string;
  created_at: string;
  type: string;
  client_id: string;
  service_point_id: string;
  start_date: string; // ISO date string
  start_time: string; // HH:MM:SS string
  end_date: string;   // ISO date string
  end_time: string;   // HH:MM:SS string
  status: "Pending" | "Approved" | "Rejected" | "Completed";
  calculated_cost?: number;
  num_agents?: number;
  cadence_hours?: number;
  inspection_type?: string;
  daily_hours_config?: any; // JSONB type
}

const fetchInterventions = async (): Promise<ServiziRichiesti[]> => {
  const { data, error } = await supabase
    .from('servizi_richiesti')
    .select('*');

  if (error) {
    console.error("Error fetching service requests:", error);
    throw new Error(error.message);
  }
  return data;
};

export function InterventionListTable() {
  const [globalFilter, setGlobalFilter] = useState("");
  const [startDateFilter, setStartDateFilter] = useState<Date | undefined>(undefined);
  const [endDateFilter, setEndDateFilter] = useState<Date | undefined>(undefined);
  const [servicePointFilter, setServicePointFilter] = useState<string>("");
  const [requestTypeFilter, setRequestTypeFilter] = useState<string>("");
  const [coOperatorFilter, setCoOperatorFilter] = useState<string>("");
  const [operatorClientFilter, setOperatorClientFilter] = useState<string>("");
  const [gpgInterventionFilter, setGpgInterventionFilter] = useState<string>("");
  const [serviceOutcomeFilter, setServiceOutcomeFilter] = useState<string>("");

  const { data, isLoading, error, refetch } = useQuery<ServiziRichiesti[], Error>({
    queryKey: ['serviziRichiesti'],
    queryFn: fetchInterventions,
  });

  const columns: ColumnDef<ServiziRichiesti>[] = useMemo(() => [
    {
      accessorKey: "id",
      header: "ID",
    },
    {
      accessorKey: "type",
      header: "Tipo Servizio",
    },
    {
      accessorKey: "client_id",
      header: "ID Cliente",
      cell: ({ row }) => row.original.client_id || "N/A",
    },
    {
      accessorKey: "service_point_id",
      header: "Punto Servizio",
      cell: ({ row }) => {
        const point = servicePointsData.find(sp => sp.code === row.original.service_point_id);
        return point ? point.name : row.original.service_point_id || "N/A";
      },
    },
    {
      accessorKey: "start_date",
      header: "Data Inizio",
      cell: ({ row }) => format(new Date(row.original.start_date), "PPP", { locale: it }),
    },
    {
      accessorKey: "start_time",
      header: "Ora Inizio",
    },
    {
      accessorKey: "end_date",
      header: "Data Fine",
      cell: ({ row }) => format(new Date(row.original.end_date), "PPP", { locale: it }),
    },
    {
      accessorKey: "end_time",
      header: "Ora Fine",
    },
    {
      accessorKey: "status",
      header: "Stato",
      cell: ({ row }) => {
        const status = row.original.status;
        let statusClass = "";
        switch (status) {
          case "Approved":
            statusClass = "bg-green-100 text-green-800";
            break;
          case "Pending":
            statusClass = "bg-yellow-100 text-yellow-800";
            break;
          case "Rejected":
            statusClass = "bg-red-100 text-red-800";
            break;
          case "Completed":
            statusClass = "bg-blue-100 text-blue-800";
            break;
          default:
            statusClass = "bg-gray-100 text-gray-800";
        }
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClass}`}>
            {status}
          </span>
        );
      },
    },
    {
      accessorKey: "num_agents",
      header: "Agenti",
      cell: ({ row }) => row.original.num_agents || "N/A",
    },
    {
      accessorKey: "calculated_cost",
      header: "Costo Stimato (€)",
      cell: ({ row }) => (row.original.calculated_cost !== undefined && row.original.calculated_cost !== null ? `${row.original.calculated_cost.toFixed(2)} €` : "N/A"),
    },
  ], []);

  const filteredData = useMemo(() => {
    if (!data) return [];

    return data.filter(item => {
      const itemStartDate = parseISO(item.start_date);
      const itemEndDate = parseISO(item.end_date);

      const matchesDateRange =
        (!startDateFilter || (isValid(itemStartDate) && itemStartDate >= startDateFilter)) &&
        (!endDateFilter || (isValid(itemEndDate) && itemEndDate <= endDateFilter));

      const matchesServicePoint = !servicePointFilter || item.service_point_id === servicePointFilter;
      const matchesRequestType = !requestTypeFilter || item.type === requestTypeFilter;
      // For other filters (coOperator, operatorClient, gpgIntervention, serviceOutcome),
      // these fields are not directly in 'servizi_richiesti' table.
      // They would typically be part of a related 'rapporti_servizio' or 'registri_cantiere' table,
      // or require a more complex join/lookup.
      // For now, we'll assume they are not directly filterable on 'servizi_richiesti'
      // or require additional data fetching/joining.
      // If these filters are crucial, we'd need to adjust the Supabase query or data structure.

      const matchesGlobalFilter = globalFilter === "" ||
        Object.values(item).some(value =>
          String(value).toLowerCase().includes(globalFilter.toLowerCase())
        );

      return matchesDateRange && matchesServicePoint && matchesRequestType && matchesGlobalFilter;
    });
  }, [data, globalFilter, startDateFilter, endDateFilter, servicePointFilter, requestTypeFilter]);

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
    setStartDateFilter(undefined);
    setEndDateFilter(undefined);
    setServicePointFilter("");
    setRequestTypeFilter("");
    setCoOperatorFilter("");
    setOperatorClientFilter("");
    setGpgInterventionFilter("");
    setServiceOutcomeFilter("");
    showSuccess("Filtri resettati!");
  };

  const handleExport = () => {
    exportTableToExcel(filteredData, "interventi_centrale_operativa", "Interventi");
  };

  const handlePrint = () => {
    printTable(columns, filteredData, "Rapporto Interventi Centrale Operativa");
  };

  const handleEmail = () => {
    const subject = "Rapporto Interventi Centrale Operativa";
    const body = `Ciao,
    
    In allegato trovi il rapporto degli interventi filtrati dalla Centrale Operativa.
    
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
                !startDateFilter && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {startDateFilter ? format(startDateFilter, "PPP", { locale: it }) : <span>Data Inizio</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={startDateFilter}
              onSelect={setStartDateFilter}
              initialFocus
              locale={it}
            />
          </PopoverContent>
        </Popover>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-[200px] justify-start text-left font-normal",
                !endDateFilter && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {endDateFilter ? format(endDateFilter, "PPP", { locale: it }) : <span>Data Fine</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={endDateFilter}
              onSelect={setEndDateFilter}
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
            <SelectItem value="">Tutti i Punti Servizio</SelectItem>
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
            <SelectItem value="">Tutte le Tipologie</SelectItem>
            {requestTypeOptions.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Placeholder for other filters not directly available in 'servizi_richiesti' */}
        <Select onValueChange={setCoOperatorFilter} value={coOperatorFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Co-Operatore" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Tutti i Co-Operatori</SelectItem>
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
            <SelectItem value="">Tutti gli Operatori Cliente</SelectItem>
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
            <SelectItem value="">Tutti i G.P.G.</SelectItem>
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
            <SelectItem value="">Tutti gli Esiti</SelectItem>
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
              </TableRow>
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
  );
}