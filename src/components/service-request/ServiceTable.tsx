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
import { ServiziRichiesti } from "@/lib/anagrafiche-data"; // Corrected import
import { ServiceDetailsDialog } from "./ServiceDetailsDialog"; // Corrected import
import { useNavigate } from "react-router-dom"; // Import useNavigate

export function ServiceTable() {
  const navigate = useNavigate();
  const [data, setData] = useState<ServiziRichiesti[]>([]); // Use ServiziRichiesti directly
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedRequestForDetails, setSelectedRequestForDetails] = useState<ServiziRichiesti | null>(null); // Use ServiziRichiesti

  const fetchServiceRequests = useCallback(async () => {
    setLoading(true);
    // Query for the related tables. The result will contain arrays for the joined tables.
    const { data: rawData, error } = await supabase
      .from('servizi_richiesti')
      .select('id, type, client_id, service_point_id, fornitore_id, start_date, start_time, end_date, end_time, status, calculated_cost, num_agents, cadence_hours, inspection_type, daily_hours_config, clienti(nome_cliente), punti_servizio(nome_punto_servizio), fornitori(nome_fornitore)')
      .order('created_at', { ascending: false });

    if (error) {
      showError(`Errore nel recupero delle richieste di servizio: ${error.message}`);
      console.error("Error fetching service requests:", error);
      setData([]);
    } else if (rawData) {
      // FIX: Supabase returns joined tables as arrays. We map the data to extract the single related object to match the ServiziRichiesti type.
      const formattedData = rawData.map(item => ({
        ...item,
        clienti: Array.isArray(item.clienti) ? item.clienti[0] : item.clienti,
        punti_servizio: Array.isArray(item.punti_servizio) ? item.punti_servizio[0] : item.punti_servizio,
        fornitori: Array.isArray(item.fornitori) ? item.fornitori[0] : item.fornitori,
      }));
      setData(formattedData as unknown as ServiziRichiesti[]);
    } else {
      setData([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchServiceRequests();
  }, [fetchServiceRequests]);

  const handleEdit = useCallback((request: ServiziRichiesti) => {
    navigate(`/service-list/edit/${request.id}`); // Navigate to the edit page
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
        .from('servizi_richiesti') // Corrected table name
        .delete()
        .eq('id', requestId);

      if (error) {
        showError(`Errore durante l'eliminazione della richiesta: ${error.message}`);
        console.error("Error deleting service request:", error);
      } else {
        showSuccess(`Richiesta "${requestType}" eliminata con successo!`);
        fetchServiceRequests(); // Refresh data after deletion
      }
    } else {
      showInfo(`Eliminazione della richiesta "${requestType}" annullata.`);
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
      accessorKey: "start_time",
      header: "Ora Inizio",
      cell: ({ row }) => <span>{row.original.start_time || 'N/A'}</span>,
    },
    {
      accessorKey: "status",
      header: "Stato",
      cell: ({ row }) => <span>{row.original.status}</span>,
    },
    {
      id: "total_quantity",
      header: "Quantità Totale (Ore/Unità)",
      cell: () => <span>N/A</span>,
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