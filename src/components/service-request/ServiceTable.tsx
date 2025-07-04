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
import { ServiceRequest as ServiceRequestBase } from "@/lib/anagrafiche-data";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ServiceRequestForm } from "./ServiceRequestForm";
import { ServiceRequestDetailsDialog } from "./ServiceRequestDetailsDialog";

// Extend ServiceRequestBase to include joined data
interface ServiceRequest extends ServiceRequestBase {
  clienti: { nome_cliente: string }[];
  punti_servizio: { nome_punto_servizio: string }[];
  fornitori: { nome_fornitore: string }[];
  client?: { nome_cliente: string }; // Added optional client property
}

export function ServiceTable() {
  const [data, setData] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedRequestForEdit, setSelectedRequestForEdit] = useState<ServiceRequest | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedRequestForDetails, setSelectedRequestForDetails] = useState<ServiceRequest | null>(null);

  const fetchServiceRequests = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('service_requests')
      .select('*, clienti(nome_cliente), punti_servizio(nome_punto_servizio), fornitori(nome_fornitore)')
      .order('created_at', { ascending: false });

    if (error) {
      showError(`Errore nel recupero delle richieste di servizio: ${error.message}`);
      console.error("Error fetching service requests:", error);
      setData([]);
    } else {
      const mappedData: ServiceRequest[] = data.map(req => ({
        ...req,
        clienti: req.clienti || [],
        punti_servizio: req.punti_servizio || [],
        fornitori: req.fornitori || [],
        // Map the first client object directly if it exists
        client: req.clienti && req.clienti.length > 0 ? req.clienti[0] : undefined,
      }));
      setData(mappedData);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchServiceRequests();
  }, [fetchServiceRequests]);

  const handleEdit = useCallback((request: ServiceRequest) => {
    setSelectedRequestForEdit(request);
    setIsEditDialogOpen(true);
  }, []);

  const handleViewDetails = useCallback((request: ServiceRequest) => {
    setSelectedRequestForDetails(request);
    setIsDetailsDialogOpen(true);
  }, []);

  const handleSaveEdit = useCallback(() => {
    fetchServiceRequests(); // Refresh data after save
    setIsEditDialogOpen(false);
    setSelectedRequestForEdit(null);
  }, [fetchServiceRequests]);

  const handleCloseEditDialog = useCallback(() => {
    setIsEditDialogOpen(false);
    setSelectedRequestForEdit(null);
  }, []);

  const handleCloseDetailsDialog = useCallback(() => {
    setIsDetailsDialogOpen(false);
    setSelectedRequestForDetails(null);
  }, []);

  const handleDelete = async (requestId: string, requestType: string) => {
    if (window.confirm(`Sei sicuro di voler eliminare la richiesta di servizio "${requestType}"?`)) {
      const { error } = await supabase
        .from('service_requests')
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
        (request.clienti && request.clienti[0]?.nome_cliente?.toLowerCase().includes(searchLower)) ||
        (request.punti_servizio && request.punti_servizio[0]?.nome_punto_servizio?.toLowerCase().includes(searchLower)) ||
        (request.fornitori && request.fornitori[0]?.nome_fornitore?.toLowerCase().includes(searchLower)) ||
        request.status.toLowerCase().includes(searchLower)
      );
    });
  }, [data, searchTerm]);

  const columns: ColumnDef<ServiceRequest>[] = useMemo(() => [
    {
      accessorKey: "type",
      header: "Tipo",
      cell: ({ row }) => <span>{row.original.type}</span>,
    },
    {
      accessorKey: "client_id",
      header: "Cliente",
      cell: ({ row }) => <span>{row.original.clienti[0]?.nome_cliente || 'N/A'}</span>,
    },
    {
      accessorKey: "service_point_id",
      header: "Punto Servizio",
      cell: ({ row }) => <span>{row.original.punti_servizio[0]?.nome_punto_servizio || 'N/A'}</span>,
    },
    {
      accessorKey: "fornitore_id",
      header: "Fornitore",
      cell: ({ row }) => <span>{row.original.fornitori[0]?.nome_fornitore || 'N/A'}</span>,
    },
    {
      accessorKey: "start_date",
      header: "Data Inizio",
      cell: ({ row }) => <span>{new Date(row.original.start_date).toLocaleDateString()}</span>,
    },
    {
      accessorKey: "start_time",
      header: "Ora Inizio",
      cell: ({ row }) => <span>{row.original.start_time}</span>,
    },
    {
      accessorKey: "status",
      header: "Stato",
      cell: ({ row }) => <span>{row.original.status}</span>,
    },
    {
      accessorKey: "calculated_cost",
      header: "Costo Stimato",
      cell: ({ row }) => <span>{row.original.calculated_cost ? `€${row.original.calculated_cost.toFixed(2)}` : 'N/A'}</span>,
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

      {selectedRequestForEdit && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Modifica Richiesta di Servizio</DialogTitle>
              <DialogDescription>
                Apporta modifiche ai dettagli della richiesta.
              </DialogDescription>
            </DialogHeader>
            <ServiceRequestForm
              request={selectedRequestForEdit}
              onSaveSuccess={handleSaveEdit}
              onCancel={handleCloseEditDialog}
            />
          </DialogContent>
        </Dialog>
      )}

      {selectedRequestForDetails && (
        <ServiceRequestDetailsDialog
          isOpen={isDetailsDialogOpen}
          onClose={handleCloseDetailsDialog}
          request={selectedRequestForDetails}
        />
      )}
    </div>
  );
}