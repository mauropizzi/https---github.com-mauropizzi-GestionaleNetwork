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
import { ServiceEditDialog } from "./ServiceEditDialog";
import { supabase } from "@/integrations/supabase/client";
import { calculateServiceCost } from "@/lib/data-fetching";
import { useServiceRequests } from "@/hooks/use-service-requests"; // Import the new hook
import { ServiceTableFilters } from "./ServiceTableFilters"; // Import the new filter component

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
  num_agents?: number | null;
  cadence_hours?: number | null;
  inspection_type?: string | null;
  daily_hours_config?: any | null;
  fornitore_id?: string | null;

  clienti?: { nome_cliente: string } | null;
  punti_servizio?: { nome_punto_servizio: string; id_cliente: string | null } | null;
}

export function ServiceTable() {
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
    puntiServizioMap, // Still needed for mapping in columns/dialogs
  } = useServiceRequests();

  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
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
      cost: service.calculated_cost || undefined,
    });
    setIsDetailsDialogOpen(true);
  };

  const handleEdit = (service: ServiceRequest) => {
    // Pass the raw service object directly. The dialog will handle display names.
    setSelectedService(service);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async (updatedFormValues: any) => {
    if (!selectedService) {
      showError("Nessun servizio selezionato per la modifica.");
      return;
    }

    // Reconstruct the payload using original service data and updated form values
    const payload = {
      ...selectedService, // Start with all original fields
      type: updatedFormValues.type,
      status: updatedFormValues.status,
      // If other fields were editable in ServiceEditDialog, they would be mapped here:
      // start_date: format(updatedFormValues.startDate, 'yyyy-MM-dd'),
      // end_date: format(updatedFormValues.endDate, 'yyyy-MM-dd'),
      // num_agents: updatedFormValues.numAgents,
      // etc.
    };

    // Recalculate cost based on potentially updated values (even if only type/status are editable now)
    const costDetails = {
      type: payload.type,
      client_id: payload.client_id,
      service_point_id: payload.service_point_id,
      fornitore_id: payload.fornitore_id,
      start_date: parseISO(payload.start_date),
      end_date: parseISO(payload.end_date),
      start_time: payload.start_time,
      end_time: payload.end_time,
      num_agents: payload.num_agents,
      cadence_hours: payload.cadence_hours,
      daily_hours_config: payload.daily_hours_config,
      inspection_type: payload.inspection_type,
    };
    const calculatedRates = await calculateServiceCost(costDetails);
    payload.calculated_cost = calculatedRates ? (calculatedRates.multiplier * calculatedRates.clientRate) : null;

    const { data, error } = await supabase
      .from('servizi_richiesti')
      .update({
        type: payload.type,
        status: payload.status,
        calculated_cost: payload.calculated_cost,
        // Add other fields here if they become editable in ServiceEditDialog
      })
      .eq('id', selectedService.id)
      .select();

    if (error) {
      showError(`Errore durante l'aggiornamento del servizio: ${error.message}`);
      console.error("Error updating service:", error);
    } else {
      showSuccess(`Servizio ${selectedService.id} aggiornato con successo!`);
      fetchServices(); // Re-fetch data to update the table
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
        fetchServices(); // Re-fetch data to update the table
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
      accessorKey: "calculated_cost",
      header: "Costo Stimato (€)",
      cell: ({ row }) => (
        <span>
          {row.original.calculated_cost !== undefined && row.original.calculated_cost !== null 
            ? `${row.original.calculated_cost.toFixed(2)} €` 
            : "N/A"}
        </span>
      ),
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
          cost: selectedService.calculated_cost || undefined,
          startTime: selectedService.start_time || undefined,
          endTime: selectedService.end_time || undefined,
          numAgents: selectedService.num_agents || undefined,
          cadenceHours: selectedService.cadence_hours || undefined,
          inspectionType: selectedService.inspection_type || undefined,
          dailyHoursConfig: selectedService.daily_hours_config || undefined,
        } : null}
      />

      {selectedService && (
        <ServiceEditDialog
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          service={selectedService} // Pass the full service object
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
}