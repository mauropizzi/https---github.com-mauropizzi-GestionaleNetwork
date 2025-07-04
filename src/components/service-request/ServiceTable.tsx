import React, { useState, useMemo } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  ColumnFiltersState,
  getFilteredRowModel,
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
import { ArrowUpDown, Edit, Trash2, Eye, PlusCircle } from "lucide-react"; // Re-added PlusCircle
import { ServiceRequest } from "@/lib/service-request-data"; // Corrected import path
import { ServiceRequestEditDialog } from "./ServiceRequestEditDialog"; // Corrected import path
import { ConfirmDialog } from "@/components/ConfirmDialog"; // Confirmed path
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";

interface ServiceTableProps {
  data: ServiceRequest[];
  isLoading: boolean;
  onRefresh: () => void;
}

export function ServiceTable({ data, isLoading, onRefresh }: ServiceTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);

  const columns: ColumnDef<ServiceRequest>[] = useMemo(
    () => [
      {
        accessorKey: "type",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Tipo
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => <div className="capitalize">{row.getValue("type")}</div>,
      },
      {
        accessorKey: "clienti", // This accessor key points to the 'clienti' object
        header: "Cliente",
        cell: ({ cell }) => {
          const clienti = cell.getValue() as { nome_cliente: string } | null;
          return (
            <div>
              {clienti?.nome_cliente || "N/A"}
            </div>
          );
        },
        enableSorting: false,
        enableColumnFilter: true,
      },
      {
        accessorKey: "punti_servizio", // This accessor key points to the 'punti_servizio' object
        header: "Punto Servizio",
        cell: ({ cell }) => {
          const puntiServizio = cell.getValue() as { nome_punto_servizio: string } | null;
          return (
            <div>
              {puntiServizio?.nome_punto_servizio || "N/A"}
            </div>
          );
        },
        enableSorting: false,
        enableColumnFilter: true,
      },
      {
        accessorKey: "start_date",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Data Inizio
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => <div>{new Date(row.getValue("start_date") as string).toLocaleDateString()}</div>,
      },
      {
        accessorKey: "end_date",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Data Fine
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => <div>{new Date(row.getValue("end_date") as string).toLocaleDateString()}</div>,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <div className="capitalize">{row.getValue("status")}</div>,
      },
      {
        accessorKey: "calculated_cost",
        header: "Costo Calcolato",
        cell: ({ row }) => <div>€{parseFloat(row.getValue("calculated_cost")).toFixed(2)}</div>,
      },
      {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => {
          const request = row.original;
          return (
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleEdit(request)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(request)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              {/* Assuming 'client' was meant to be 'clienti?.nome_cliente' for display */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  // Example of how to access client name if needed for a view dialog
                  const clientName = request.clienti?.nome_cliente || 'N/A';
                  showSuccess(`Viewing request for client: ${clientName}`);
                  // Replace with actual view dialog logic
                }}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          );
        },
      },
    ],
    []
  );

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
  });

  const handleAdd = () => {
    setSelectedRequest(null);
    setIsEditDialogOpen(true);
  };

  const handleEdit = (request: ServiceRequest) => {
    setSelectedRequest(request);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (request: ServiceRequest) => {
    setSelectedRequest(request);
    setIsConfirmDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (selectedRequest) {
      const { error } = await supabase
        .from("service_requests")
        .delete()
        .eq("id", selectedRequest.id);

      if (error) {
        showError(`Errore durante l'eliminazione: ${error.message}`);
      } else {
        showSuccess("Richiesta di servizio eliminata con successo!");
        onRefresh();
      }
      setIsConfirmDialogOpen(false);
      setSelectedRequest(null);
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center py-4">
        <Input
          placeholder="Cerca per tipo..."
          value={(table.getColumn("type")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("type")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <Button onClick={handleAdd} className="ml-auto">
          <PlusCircle className="mr-2 h-4 w-4" /> Aggiungi Richiesta
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
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Caricamento richieste...
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
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
                  Nessuna richiesta trovata.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Precedente
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Successiva
        </Button>
      </div>

      <ServiceRequestEditDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        serviceRequest={selectedRequest}
        onSaveSuccess={onRefresh}
      />

      <ConfirmDialog
        isOpen={isConfirmDialogOpen}
        onClose={() => setIsConfirmDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Conferma Eliminazione"
        description={`Sei sicuro di voler eliminare la richiesta di servizio ${selectedRequest?.type}? Questa azione non può essere annullata.`}
      />
    </div>
  );
}