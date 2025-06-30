import React, { useState, useEffect, useCallback, useMemo } from "react";
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
import { showInfo, showSuccess, showError } from "@/utils/toast";
import { format } from "date-fns";
import { it } from 'date-fns/locale';
import { Eye, Edit, Trash2, RefreshCcw } from "lucide-react";
import { ServiceDetailsDialog } from "./ServiceDetailsDialog";
import { ServiceEditDialog } from "./ServiceEditDialog";
import { supabase } from "@/integrations/supabase/client"; // Import Supabase client
import { fetchClienti, fetchPuntiServizio } from "@/lib/data-fetching"; // Import data fetching utilities
import { Cliente, PuntoServizio } from "@/lib/anagrafiche-data"; // Import interfaces

// Define the structure of a service request from Supabase
interface ServiceRequest {
  id: string;
  type: string;
  client_id?: string | null; // Changed to client_id (UUID)
  service_point_id?: string | null; // New field for service point
  start_date: string; // Changed to string to match DB
  start_time?: string | null; // New field
  end_date: string; // Changed to string to match DB
  end_time?: string | null; // New field
  status: "Pending" | "Approved" | "Rejected" | "Completed";
  calculated_cost?: number | null; // Changed to calculated_cost
  num_agents?: number | null; // New field
  cadence_hours?: number | null; // New field
  inspection_type?: string | null; // New field
  daily_hours_config?: any | null; // New field for JSONB

  // Joined fields for display
  clienti?: { nome_cliente: string } | null;
  punti_servizio?: { nome_punto_servizio: string } | null;
}

export function ServiceTable() {
  const [data, setData] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceRequest | null>(null);
  const [clientiMap, setClientiMap] = useState<Map<string, Cliente>>(new Map());
  const [puntiServizioMap, setPuntiServizioMap] = useState<Map<string, PuntoServizio>>(new Map());

  const fetchServices = useCallback(async () => {
    setLoading(true);
    const { data: servicesData, error } = await supabase
      .from('servizi_richiesti')
      .select('*, clienti(nome_cliente), punti_servizio(nome_punto_servizio)'); // Fetch related client and service point names

    if (error) {
      showError(`Errore nel recupero dei servizi: ${error.message}`);
      console.error("Error fetching services:", error);
      setData([]);
    } else {
      setData(servicesData || []);
    }
    setLoading(false);
  }, []);

  const fetchAnagraficheMaps = useCallback(async () => {
    const fetchedClienti = await fetchClienti();
    const cliMap = new Map<string, Cliente>();
    fetchedClienti.forEach(c => cliMap.set(c.id, c));
    setClientiMap(cliMap);

    const fetchedPuntiServizio = await fetchPuntiServizio();
    const psMap = new Map<string, PuntoServizio>();
    fetchedPuntiServizio.forEach(ps => psMap.set(ps.id, ps));
    setPuntiServizioMap(psMap);
  }, []);

  useEffect(() => {
    fetchServices();
    fetchAnagraficheMaps();
  }, [fetchServices, fetchAnagraficheMaps]);

  const handleView = (service: ServiceRequest) => {
    setSelectedService({
      ...service,
      client: service.clienti?.nome_cliente || 'N/A',
      location: service.punti_servizio?.nome_punto_servizio || 'N/A',
      startDate: new Date(service.start_date),
      endDate: new Date(service.end_date),
      cost: service.calculated_cost || undefined,
    });
    setIsDetailsDialogOpen(true);
  };

  const handleEdit = (service: ServiceRequest) => {
    setSelectedService({
      ...service,
      client: service.clienti?.nome_cliente || '', // Pass name for form default
      location: service.punti_servizio?.nome_punto_servizio || '', // Pass name for form default
      startDate: new Date(service.start_date),
      endDate: new Date(service.end_date),
      cost: service.calculated_cost || undefined,
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async (updatedService: any) => { // updatedService will be from the form schema
    if (!selectedService) {
      showError("Nessun servizio selezionato per la modifica.");
      return;
    }

    // Map form values back to DB schema
    const payload = {
      type: updatedService.type,
      // client_id and service_point_id are not directly editable in this dialog,
      // assuming they remain the same as the original selectedService.
      // If they were editable, you'd need to map names back to IDs.
      start_date: format(selectedService.startDate, 'yyyy-MM-dd'), // Keep original dates for now
      start_time: selectedService.start_time,
      end_date: format(selectedService.endDate, 'yyyy-MM-dd'), // Keep original dates for now
      end_time: selectedService.end_time,
      status: updatedService.status,
      calculated_cost: updatedService.cost,
      num_agents: selectedService.num_agents,
      cadence_hours: selectedService.cadence_hours,
      inspection_type: selectedService.inspection_type,
      daily_hours_config: selectedService.daily_hours_config,
    };

    const { data, error } = await supabase
      .from('servizi_richiesti')
      .update(payload)
      .eq('id', selectedService.id)
      .select();

    if (error) {
      showError(`Errore durante l'aggiornamento del servizio: ${error.message}`);
      console.error("Error updating service:", error);
    } else {
      showSuccess(`Servizio ${selectedService.id} aggiornato con successo!`);
      fetchServices(); // Refresh data after update
    }
    setIsEditDialogOpen(false);
    setSelectedService(null);
  };

  const handleDelete = async (serviceId: string) => {
    if (window.confirm(`Sei sicuro di voler eliminare il servizio ${serviceId}?`)) {
      const { error } = await supabase
        .from('servizi_richiesti')
        .delete()
        .eq('id', serviceId);

      if (error) {
        showError(`Errore durante l'eliminazione del servizio: ${error.message}`);
        console.error("Error deleting service:", error);
      } else {
        showSuccess(`Servizio ${serviceId} eliminato con successo!`);
        fetchServices(); // Refresh data after deletion
      }
    } else {
      showInfo(`Eliminazione del servizio ${serviceId} annullata.`);
    }
  };

  const columns: ColumnDef<ServiceRequest>[] = useMemo(() => [
    {
      accessorKey: "id",
      header: "ID Servizio",
    },
    {
      accessorKey: "type",
      header: "Tipo Servizio",
    },
    {
      accessorKey: "client_id",
      header: "Cliente",
      cell: ({ row }) => row.original.clienti?.nome_cliente || 'N/A',
    },
    {
      accessorKey: "service_point_id",
      header: "Punto Servizio",
      cell: ({ row }) => row.original.punti_servizio?.nome_punto_servizio || 'N/A',
    },
    {
      accessorKey: "start_date",
      header: "Data Inizio",
      cell: ({ row }) => format(new Date(row.original.start_date), "PPP", { locale: it }),
    },
    {
      accessorKey: "end_date",
      header: "Data Fine",
      cell: ({ row }) => format(new Date(row.original.end_date), "PPP", { locale: it }),
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
      accessorKey: "calculated_cost",
      header: "Costo Stimato (€)",
      cell: ({ row }) => (row.original.calculated_cost !== undefined && row.original.calculated_cost !== null ? `${row.original.calculated_cost.toFixed(2)} €` : "N/A"),
    },
    {
      id: "actions",
      header: "Azioni",
      cell: ({ row }) => (
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleView(row.original)}
            title="Visualizza"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleEdit(row.original)}
            title="Modifica"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleDelete(row.original.id)}
            title="Elimina"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ], [handleView, handleEdit, handleDelete]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-end mb-4">
        <Button variant="outline" onClick={fetchServices} disabled={loading}>
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
                  Caricamento servizi...
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
                  Nessun servizio trovato.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Service Details Dialog */}
      <ServiceDetailsDialog
        isOpen={isDetailsDialogOpen}
        onClose={() => setIsDetailsDialogOpen(false)}
        service={selectedService ? {
          id: selectedService.id,
          type: selectedService.type,
          client: selectedService.clienti?.nome_cliente || 'N/A',
          location: selectedService.punti_servizio?.nome_punto_servizio || 'N/A',
          startDate: new Date(selectedService.start_date),
          endDate: new Date(selectedService.end_date),
          status: selectedService.status,
          cost: selectedService.calculated_cost || undefined,
        } : null}
      />

      {/* Service Edit Dialog */}
      <ServiceEditDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        service={selectedService ? {
          id: selectedService.id,
          type: selectedService.type,
          client: selectedService.clienti?.nome_cliente || '', // Pass name for form default
          location: selectedService.punti_servizio?.nome_punto_servizio || '', // Pass name for form default
          startDate: new Date(selectedService.start_date),
          endDate: new Date(selectedService.end_date),
          status: selectedService.status,
          cost: selectedService.calculated_cost || undefined,
        } : null}
        onSave={handleSaveEdit}
      />
    </div>
  );
}