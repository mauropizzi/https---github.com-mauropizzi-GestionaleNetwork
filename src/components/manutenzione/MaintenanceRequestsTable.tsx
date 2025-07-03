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
import { RefreshCcw, Eye } from "lucide-react";
import { showInfo, showError } from "@/utils/toast";
import { supabase } from "@/integrations/supabase/client";
import { RichiestaManutenzione } from "@/lib/anagrafiche-data";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function MaintenanceRequestsTable() {
  const [data, setData] = useState<RichiestaManutenzione[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("Pending"); // Default filter to Pending

  const fetchMaintenanceRequests = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('richieste_manutenzione')
      .select('*, service_point:punti_servizio(nome_punto_servizio), requested_by_employee:personale(nome, cognome)')
      .order('requested_at', { ascending: false });

    if (filterStatus !== "All") {
      query = query.eq('status', filterStatus);
    }

    const { data: requests, error } = await query;

    if (error) {
      showError(`Errore nel recupero delle richieste di manutenzione: ${error.message}`);
      console.error("Error fetching maintenance requests:", error);
      setData([]);
    } else {
      setData(requests || []);
    }
    setLoading(false);
  }, [filterStatus]);

  useEffect(() => {
    fetchMaintenanceRequests();
  }, [fetchMaintenanceRequests]);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase
      .from('richieste_manutenzione')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      showError(`Errore nell'aggiornamento dello stato: ${error.message}`);
      console.error("Error updating maintenance request status:", error);
    } else {
      showInfo("Stato richiesta aggiornato.");
      fetchMaintenanceRequests(); // Refresh data
    }
  };

  const filteredData = useMemo(() => {
    return data.filter(request => {
      const searchLower = searchTerm.toLowerCase();
      const servicePointName = request.service_point?.nome_punto_servizio || 'N/A';
      const employeeName = request.requested_by_employee ? `${request.requested_by_employee.nome} ${request.requested_by_employee.cognome}` : 'N/A';

      return (
        request.vehicle_plate.toLowerCase().includes(searchLower) ||
        servicePointName.toLowerCase().includes(searchLower) ||
        (request.issue_description?.toLowerCase().includes(searchLower)) ||
        employeeName.toLowerCase().includes(searchLower) ||
        request.status.toLowerCase().includes(searchLower) ||
        request.priority.toLowerCase().includes(searchLower)
      );
    });
  }, [data, searchTerm]);

  const columns: ColumnDef<RichiestaManutenzione>[] = useMemo(() => [
    {
      accessorKey: "requested_at",
      header: "Data Richiesta",
      cell: ({ row }) => <span>{format(parseISO(row.original.requested_at), "PPP HH:mm", { locale: it })}</span>,
    },
    {
      accessorKey: "service_point_id",
      header: "Punto Servizio",
      cell: ({ row }) => <span>{row.original.service_point?.nome_punto_servizio || 'N/A'}</span>,
    },
    {
      accessorKey: "vehicle_plate",
      header: "Targa Veicolo",
    },
    {
      accessorKey: "issue_description",
      header: "Descrizione Problema",
      cell: ({ row }) => <span className="line-clamp-2">{row.original.issue_description || 'N/A'}</span>,
    },
    {
      accessorKey: "requested_by_employee_id",
      header: "Richiesto da",
      cell: ({ row }) => <span>{row.original.requested_by_employee ? `${row.original.requested_by_employee.nome} ${row.original.requested_by_employee.cognome}` : 'N/A'}</span>,
    },
    {
      accessorKey: "priority",
      header: "Priorità",
      cell: ({ row }) => {
        const priority = row.original.priority;
        let priorityClass = "";
        switch (priority) {
          case "Urgent":
            priorityClass = "bg-red-100 text-red-800";
            break;
          case "High":
            priorityClass = "bg-orange-100 text-orange-800";
            break;
          case "Medium":
            priorityClass = "bg-yellow-100 text-yellow-800";
            break;
          case "Low":
            priorityClass = "bg-green-100 text-green-800";
            break;
          default:
            priorityClass = "bg-gray-100 text-gray-800";
        }
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityClass}`}>
            {priority}
          </span>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Stato",
      cell: ({ row }) => (
        <Select onValueChange={(value) => handleUpdateStatus(row.original.id, value)} value={row.original.status}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Seleziona stato" />
          </SelectTrigger>
          <SelectContent>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="Cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      ),
    },
  ], [handleUpdateStatus]);

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <Input
          placeholder="Cerca per targa, descrizione, punto servizio..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Select onValueChange={setFilterStatus} value={filterStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtra per stato" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">Tutti gli Stati</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="In Progress">In Progress</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
            <SelectItem value="Cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={() => { setSearchTerm(''); setFilterStatus('Pending'); }}>
          Reset Filtri
        </Button>
        <Button variant="outline" onClick={fetchMaintenanceRequests} disabled={loading}>
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
                  Caricamento richieste di manutenzione...
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
                  Nessuna richiesta di manutenzione trovata.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}