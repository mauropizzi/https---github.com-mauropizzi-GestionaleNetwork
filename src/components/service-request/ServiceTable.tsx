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
import { format, isAfter, isBefore, parseISO } from "date-fns";
import { it } from 'date-fns/locale';
import { Eye, Edit, Trash2, RefreshCcw, CalendarIcon } from "lucide-react";
import { ServiceDetailsDialog } from "./ServiceDetailsDialog";
import { ServiceEditDialog } from "./ServiceEditDialog";
import { supabase } from "@/integrations/supabase/client";
import { fetchClienti, fetchPuntiServizio, calculateServiceCost } from "@/lib/data-fetching";
import { Cliente, PuntoServizio } from "@/lib/anagrafiche-data";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

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
  const [data, setData] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceRequest | null>(null);
  const [startDateFilter, setStartDateFilter] = useState<Date | undefined>(undefined);
  const [endDateFilter, setEndDateFilter] = useState<Date | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState("");
  const [puntiServizioMap, setPuntiServizioMap] = useState<Map<string, PuntoServizio & { nome_cliente?: string }>>(new Map());


  const fetchServices = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('servizi_richiesti')
      .select('id, type, client_id, service_point_id, fornitore_id, start_date, start_time, end_date, end_time, status, num_agents, cadence_hours, inspection_type, daily_hours_config, clienti(nome_cliente), punti_servizio(nome_punto_servizio, id_cliente)');

    if (startDateFilter) {
      query = query.gte('start_date', format(startDateFilter, 'yyyy-MM-dd'));
    }
    if (endDateFilter) {
      query = query.lte('end_date', format(endDateFilter, 'yyyy-MM-dd'));
    }

    const { data: servicesData, error } = await query;

    if (error) {
      showError(`Errore nel recupero dei servizi: ${error.message}`);
      console.error("Error fetching services:", error);
      setData([]);
    } else {
      const servicesWithCalculatedCost = await Promise.all(servicesData.map(async (service) => {
        const serviceStartDate = parseISO(service.start_date);
        const serviceEndDate = parseISO(service.end_date);

        const costDetails = {
          type: service.type,
          client_id: service.client_id,
          service_point_id: service.service_point_id,
          fornitore_id: service.fornitore_id,
          start_date: serviceStartDate,
          end_date: serviceEndDate,
          start_time: service.start_time,
          end_time: service.end_time,
          num_agents: service.num_agents,
          cadence_hours: service.cadence_hours,
          daily_hours_config: service.daily_hours_config,
          inspection_type: service.inspection_type,
        };
        const calculatedRates = await calculateServiceCost(costDetails);
        return { ...service, calculated_cost: calculatedRates ? (calculatedRates.multiplier * calculatedRates.clientRate) : null };
      }));
      setData(servicesWithCalculatedCost || []);
    }
    setLoading(false);
  }, [startDateFilter, endDateFilter]);

  const fetchAnagraficheMaps = useCallback(async () => {
    const fetchedPuntiServizio = await supabase
      .from('punti_servizio')
      .select('id, nome_punto_servizio, id_cliente, clienti(nome_cliente)');

    if (fetchedPuntiServizio.error) {
      console.error("Error fetching punti_servizio for map:", fetchedPuntiServizio.error);
      return;
    }

    const psMap = new Map<string, PuntoServizio & { nome_cliente?: string }>();
    fetchedPuntiServizio.data.forEach(ps => {
      psMap.set(ps.id, {
        ...ps,
        nome_cliente: ps.clienti?.nome_cliente || 'N/A'
      });
    });
    setPuntiServizioMap(psMap);
  }, []);

  useEffect(() => {
    fetchServices();
    fetchAnagraficheMaps();
  }, [fetchServices, fetchAnagraficheMaps]);

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
    const clientName = service.clienti?.nome_cliente || '';
    const servicePointName = service.punti_servizio?.nome_punto_servizio || '';

    setSelectedService({
      ...service,
      client: clientName,
      location: servicePointName,
      startDate: new Date(service.start_date),
      endDate: new Date(service.end_date),
      cost: service.calculated_cost || undefined,
    });
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
      fetchServices();
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

  const handleResetFilters = () => {
    setStartDateFilter(undefined);
    setEndDateFilter(undefined);
    setSearchTerm("");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 items-center mb-4">
        <Input
          placeholder="Cerca per tipo, cliente, punto servizio..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-full md:w-auto justify-start text-left font-normal",
                !startDateFilter && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {startDateFilter ? format(startDateFilter, "PPP", { locale: it }) : "Data Inizio"}
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
                "w-full md:w-auto justify-start text-left font-normal",
                !endDateFilter && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {endDateFilter ? format(endDateFilter, "PPP", { locale: it }) : "Data Fine"}
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
        <Button variant="outline" onClick={handleResetFilters}>
          Reset Filtri
        </Button>
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

      <ServiceEditDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
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
        onSave={handleSaveEdit}
      />
    </div>
  );
}