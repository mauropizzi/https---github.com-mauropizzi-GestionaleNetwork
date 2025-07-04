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
import { format, parseISO } from "date-fns";
import { it } from 'date-fns/locale';
import { Eye, Edit, Trash2 } from "lucide-react";
import { ServiceDetailsDialog } from "./ServiceDetailsDialog";
// import { ServiceEditDialog } from "./ServiceEditDialog"; // REMOVE THIS IMPORT
import { supabase } from "@/integrations/supabase/client";
import { calculateServiceMultiplier } from "@/lib/data-fetching";
import { useServiceRequests } from "@/hooks/use-service-requests";
import { ServiceTableFilters } from "./ServiceTableFilters";
import { useNavigate } from "react-router-dom"; // Import useNavigate

interface ServiceRequest {
  id: string;
  type: string;
  client_id?: string | null;
  service_point_id?: string | null;
  start_date: string;
  start_time?: string | null;
  end_date: string;
  end_time?: string | null;
  status: "Pending" | "Approved" | "Rejected" | "Completed";
  calculated_cost?: number | null;
  multiplier?: number | null;
  num_agents?: number | null;
  cadence_hours?: number | null;
  inspection_type?: string | null;
  daily_hours_config?: any | null;
  fornitore_id?: string | null;

  clienti?: { nome_cliente: string } | null;
  punti_servizio?: { nome_punto_servizio: string; id_cliente: string | null } | null;
}

export function ServiceTable() {
  const navigate = useNavigate(); // Initialize useNavigate
  const {
    data,
    loading,
    searchTerm,
    setSearchTerm,
    startDateFilter,
    setStartDateFilter,
    endDateFilter,
    setEndDateFilter,
    fetchServices,
    handleResetFilters,
    puntiServizioMap,
  } = useServiceRequests();

  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceRequest | null>(null);

  const handleView = (service: ServiceRequest) => {
    const clientName = service.clienti?.nome_cliente || 'N/A';
    const servicePointName = service.punti_servizio?.nome_punto_servizio || 'N/A';

    setSelectedService({
      ...service,
      client: clientName,
      location: servicePointName,
      startDate: new Date(service.start_date),
      endDate: new Date(service.end_date),
      // The following fields are already part of ServiceRequest, but were explicitly added to the dialog's interface
      // and might need to be mapped if the dialog's interface is not directly ServiceRequest
      startTime: service.start_time || undefined,
      endTime: service.end_time || undefined,
      numAgents: service.num_agents || undefined,
      cadenceHours: service.cadence_hours || undefined,
      inspectionType: service.inspection_type || undefined,
      dailyHoursConfig: service.daily_hours_config || undefined,
    });
    setIsDetailsDialogOpen(true);
  };

  const handleEdit = (service: ServiceRequest) => {
    // Navigate to the dedicated edit page for this service
    navigate(`/service-list/edit/${service.id}`);
  };

  // REMOVE handleSaveEdit as it's now handled by the dedicated edit page

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
        fetchServices();
      }
    } else {
      showInfo(`Eliminazione del servizio ${serviceId} annullata.`);
    }
  };

  const filteredData = useMemo(() => {
    return data.filter(service => {
      const clientName = service.clienti?.nome_cliente || 'N/A';
      const servicePointName = service.punti_servizio?.nome_punto_servizio || 'N/A';

      const matchesSearch = searchTerm.toLowerCase() === '' ||
        service.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        servicePointName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.status.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesSearch;
    });
  }, [data, searchTerm]);

  const columns: ColumnDef<ServiceRequest>[] = useMemo(() => [
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
      accessorKey: "multiplier",
      header: "Numero Ore/Servizi",
      cell: ({ row }) => {
        const multiplier = row.original.multiplier;
        let unit = "";
        switch (row.original.type) {
          case "Piantonamento":
          case "Servizi Fiduciari":
            unit = "ore";
            break;
          case "Ispezioni":
          case "Bonifiche":
          case "Gestione Chiavi":
          case "Apertura/Chiusura":
          case "Intervento":
            unit = "interventi";
            break;
          default:
            unit = "";
        }
        return (
          <span>
            {multiplier !== undefined && multiplier !== null
              ? `${multiplier.toFixed(2)} ${unit}`
              : "N/A"}
          </span>
        );
      },
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
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-4">
      <ServiceTableFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        startDateFilter={startDateFilter}
        setStartDateFilter={setStartDateFilter}
        endDateFilter={endDateFilter}
        setEndDateFilter={setEndDateFilter}
        handleResetFilters={handleResetFilters}
        onRefresh={fetchServices}
        loading={loading}
      />
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
          startTime: selectedService.start_time || undefined,
          endTime: selectedService.end_time || undefined,
          numAgents: selectedService.num_agents || undefined,
          cadenceHours: selectedService.cadence_hours || undefined,
          inspectionType: selectedService.inspection_type || undefined,
          dailyHoursConfig: selectedService.daily_hours_config || undefined,
        } : null}
      />

      {/* ServiceEditDialog is no longer used here */}
    </div>
  );
}