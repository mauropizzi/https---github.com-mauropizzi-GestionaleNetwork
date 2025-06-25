import React, { useState } from "react";
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
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { it } from 'date-fns/locale';

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

const columns: ColumnDef<ServiziRichiesti>[] = [
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
    cell: ({ row }) => row.original.client_id || "N/A", // Display ID for now
  },
  {
    accessorKey: "service_point_id",
    header: "ID Punto Servizio",
    cell: ({ row }) => row.original.service_point_id || "N/A", // Display ID for now
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
];

export function InterventionListTable() {
  const [globalFilter, setGlobalFilter] = useState("");

  const { data, isLoading, error } = useQuery<ServiziRichiesti[], Error>({
    queryKey: ['serviziRichiesti'],
    queryFn: fetchInterventions,
  });

  const table = useReactTable({
    data: data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
  });

  if (isLoading) {
    return <div className="text-center py-8">Caricamento interventi...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">Errore nel caricamento degli interventi: {error.message}</div>;
  }

  return (
    <div className="space-y-4">
      <Input
        placeholder="Cerca in tutti i campi..."
        value={globalFilter ?? ""}
        onChange={(event) => setGlobalFilter(event.target.value)}
        className="max-w-sm"
      />
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