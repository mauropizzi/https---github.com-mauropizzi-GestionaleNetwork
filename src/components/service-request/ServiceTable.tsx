"use client";

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
import { Edit, Trash2, RefreshCcw, Eye } from "lucide-react";
import { showInfo, showError, showSuccess } from "@/utils/toast";
import { supabase } from "@/integrations/supabase/client";
import { ServiziRichiesti } from "@/lib/anagrafiche-data";
import { ServiceDetailsDialog } from "./ServiceDetailsDialog";
import { useNavigate } from "react-router-dom";
import { calculateServiceCost } from "@/lib/data-fetching"; // Import the calculation function
import { format } from "date-fns"; // Import format for date formatting

export function ServiceTable() {
  const navigate = useNavigate();
  const [data, setData] = useState<ServiziRichiesti[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedRequestForDetails, setSelectedRequestForDetails] = useState<ServiziRichiesti | null>(null);

  const fetchServiceRequests = useCallback(async () => {
    setLoading(true);
    const { data: requests, error } = await supabase
      .from('servizi_richiesti')
      .select('*, clienti(nome_cliente), punti_servizio(nome_punto_servizio), fornitori(nome_fornitore)')
      .order('created_at', { ascending: false });

    if (error) {
      showError(`Errore nel recupero delle richieste di servizio: ${error.message}`);
      console.error("Error fetching service requests:", error);
      setData([]);
    } else if (requests) {
      // Dynamically calculate total_units and unit_of_measure for each request
      const processedData = await Promise.all(
        requests.map(async (request) => {
          if (!request.start_date || !request.end_date) {
            return request; // Return original request if dates are missing
          }

          const costDetails = await calculateServiceCost({
            type: request.type,
            client_id: request.client_id,
            service_point_id: request.service_point_id,
            fornitore_id: request.fornitore_id,
            start_date: new Date(request.start_date),
            end_date: new Date(request.end_date),
            start_time: request.start_time,
            end_time: request.end_time,
            num_agents: request.num_agents,
            cadence_hours: request.cadence_hours,
            daily_hours_config: request.daily_hours_config,
            inspection_type: request.inspection_type,
          });

          if (costDetails) {
            return {
              ...request,
              total_units: costDetails.multiplier,
              unit_of_measure: costDetails.unitOfMeasure,
            };
          }
          // Fallback to the stored value if calculation fails
          return request;
        })
      );
      setData(processedData);
    } else {
      setData([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchServiceRequests();
  }, [fetchServiceRequests]);

  const handleEdit = useCallback((request: ServiziRichiesti) => {
    navigate(`/service-list/edit/${request.id}`);
  }, [navigate]);

  const handleViewDetails = useCallback((request: ServiziRichiesti) => {
    setSelectedRequestForDetails(request);
    setIsDetailsDialogOpen(true);
  }, []);

  const handleCloseDetailsDialog = useCallback(() => {
    setIsDetailsDialogOpen(false);
    setSelectedRequestForDetails(null);
  }, []);

  const handleDelete = async (requestId: string, requestType: string) => {
    if (window.confirm(`Sei sicuro di voler eliminare la richiesta di servizio "${requestType}"?`)) {
      const { error } = await supabase
        .from('servizi_richiesti')
        .delete()
        .eq('id', requestId);

      if (error) {
        showError(`Errore durante l'eliminazione della richiesta: ${error.message}`);
        console.error("Error deleting service request:", error);
      } else {
        showSuccess(`Richiesta "${requestType}" eliminata con successo!`);
        fetchServiceRequests();
      }
    } else {
      showInfo(`Eliminazione della richiesta "${requestType}" annullata.`);
    }
  };

  const translateStatus = (status: string) => {
    switch (status) {
      case "Pending":
        return "In Attesa";
      case "Approved":
        return "Approvato";
      case "Rejected":
        return "Rifiutato";
      case "Completed":
        return "Completato";
      default:
        return status;
    }
  };

  const filteredData = useMemo(() => {
    return data.filter(request => {
      const searchLower = searchTerm.toLowerCase();
      return (
        request.type.toLowerCase().includes(searchLower) ||
        (request.clienti?.nome_cliente?.toLowerCase().includes(searchLower)) ||
        (request.punti_servizio?.nome_punto_servizio?.toLowerCase().includes(searchLower)) ||
        (request.fornitori?.nome_fornitore?.toLowerCase().includes(searchLower)) ||
        request.status.toLowerCase().includes(searchLower)
      );
    });
  }, [data, searchTerm]);

  const columns: ColumnDef<ServiziRichiesti>[] = useMemo(() => [
    {
      accessorKey: "type",
      header: "Tipo",
      cell: ({ row }) => <span>{row.original.type}</span>,
    },
    {
      accessorKey: "client_id",
      header: "Cliente",
      cell: ({ row }) => <span>{row.original.clienti?.nome_cliente || 'N/A'}</span>,
    },
    {
      accessorKey: "service_point_id",
      header: "Punto Servizio",
      cell: ({ row }) => <span>{row.original.punti_servizio?.nome_punto_servizio || 'N/A'}</span>,
    },
    {
      accessorKey: "fornitore_id",
      header: "Fornitore",
      cell: ({ row }) => <span>{row.original.fornitori?.nome_fornitore || 'N/A'}</span>,
    },
    {
      accessorKey: "start_date",
      header: "Data Inizio",
      cell: ({ row }) => <span>{new Date(row.original.start_date).toLocaleDateString()}</span>,
    },
    {
      accessorKey: "end_date", // Changed accessorKey
      header: "Data Fine", // Changed header
      cell: ({ row }) => <span>{row.original.end_date ? format(new Date(row.original.end_date), 'dd/MM/yyyy') : 'N/A'}</span>, // Format end_date
    },
    {
      accessorKey: "status",
      header: "Stato",
      cell: ({ row }) => <span>{translateStatus(row.original.status)}</span>, // Translate status
    },
    {
      accessorKey: "total_units",
      header: "Quantità Totale",
      cell: ({ row }) => {
        return (
          <span>
            {row.original.total_units !== null && row.original.total_units !== undefined
              ? `${row.original.total_units.toFixed(2)} ${row.original.unit_of_measure || ''}`
              : 'N/A'}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "Azioni",
      cell: ({ row }) => (
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={() => handleViewDetails(row.original)} title="Visualizza Dettagli">
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleEdit(row.original)} title="Modifica">
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="destructive" size="sm" onClick={() => handleDelete(row.original.id!, row.original.type)} title="Elimina">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ], [handleEdit, handleDelete, handleViewDetails]);

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <Input
          placeholder="Cerca per tipo, cliente, punto servizio, fornitore..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Button variant="outline" onClick={fetchServiceRequests} disabled={loading}>
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
                  Caricamento richieste di servizio...
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
                  Nessuna richiesta di servizio trovata.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {selectedRequestForDetails && (
        <ServiceDetailsDialog
          isOpen={isDetailsDialogOpen}
          onClose={handleCloseDetailsDialog}
          service={{
            id: selectedRequestForDetails.id,
            type: selectedRequestForDetails.type,
            client: selectedRequestForDetails.clienti?.nome_cliente || 'N/A',
            location: selectedRequestForDetails.punti_servizio?.nome_punto_servizio || 'N/A',
            startDate: new Date(selectedRequestForDetails.start_date),
            endDate: selectedRequestForDetails.end_date ? new Date(selectedRequestForDetails.end_date) : new Date(selectedRequestForDetails.start_date),
            status: selectedRequestForDetails.status,
            startTime: selectedRequestForDetails.start_time || undefined,
            endTime: selectedRequestForDetails.end_time || undefined,
            numAgents: selectedRequestForDetails.num_agents || undefined,
            cadenceHours: selectedRequestForDetails.cadence_hours || undefined,
            inspectionType: selectedRequestForDetails.inspection_type || undefined,
            dailyHoursConfig: selectedRequestForDetails.daily_hours_config || undefined,
          }}
        />
      )}
    </div>
  );
}