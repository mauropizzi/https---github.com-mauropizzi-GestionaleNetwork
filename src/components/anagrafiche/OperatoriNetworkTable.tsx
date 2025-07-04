import React, { useState, useEffect, useMemo } from "react";
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
import { PlusCircle, ArrowUpDown, Edit, Trash2 } from "lucide-react";
import { OperatoreNetwork } from "@/lib/anagrafiche-data";
import { OperatoreNetworkEditDialog } from "./OperatoreNetworkEditDialog"; // Corrected import name
import { ConfirmDialog } from "@/components/ConfirmDialog"; // Confirmed path
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { fetchOperatoriNetwork } from "@/lib/data-fetching";

interface OperatoriNetworkTableProps {
  data: OperatoreNetwork[];
  isLoading: boolean;
  onRefresh: () => void;
}

export function OperatoriNetworkTable({
  data,
  isLoading,
  onRefresh,
}: OperatoriNetworkTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [selectedOperatore, setSelectedOperatore] =
    useState<OperatoreNetwork | null>(null);

  const columns: ColumnDef<OperatoreNetwork>[] = useMemo(
    () => [
      {
        accessorKey: "nome",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Nome
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => <div className="capitalize">{row.getValue("nome")}</div>,
      },
      {
        accessorKey: "cognome",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Cognome
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => <div className="capitalize">{row.getValue("cognome")}</div>,
      },
      {
        accessorKey: "telefono",
        header: "Telefono",
      },
      {
        accessorKey: "email",
        header: "Email",
      },
      {
        accessorKey: "clienti", // This accessor key will now correctly point to the object
        header: "Cliente Associato",
        cell: ({ cell }) => {
          const clienti = cell.getValue() as { nome_cliente: string } | null;
          // Safely access nome_cliente from the object
          return (
            <div>
              {clienti?.nome_cliente || "N/A"}
            </div>
          );
        },
        enableSorting: false,
        enableColumnFilter: false,
      },
      {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => {
          const operatore = row.original;
          return (
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleEdit(operatore)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(operatore)}
              >
                <Trash2 className="h-4 w-4" />
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
    setSelectedOperatore(null);
    setIsEditDialogOpen(true);
  };

  const handleEdit = (operatore: OperatoreNetwork) => {
    setSelectedOperatore(operatore);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (operatore: OperatoreNetwork) => {
    setSelectedOperatore(operatore);
    setIsConfirmDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (selectedOperatore) {
      const { error } = await supabase
        .from("operatori_network")
        .delete()
        .eq("id", selectedOperatore.id);

      if (error) {
        showError(`Errore durante l'eliminazione: ${error.message}`);
      } else {
        showSuccess("Operatore eliminato con successo!");
        onRefresh();
      }
      setIsConfirmDialogOpen(false);
      setSelectedOperatore(null);
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center py-4">
        <Input
          placeholder="Cerca per nome..."
          value={(table.getColumn("nome")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("nome")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <Button onClick={handleAdd} className="ml-auto">
          <PlusCircle className="mr-2 h-4 w-4" /> Aggiungi Operatore
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
                  Caricamento operatori...
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
                  Nessun operatore trovato.
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

      <OperatoreNetworkEditDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        operatore={selectedOperatore}
        onSaveSuccess={onRefresh}
      />

      <ConfirmDialog
        isOpen={isConfirmDialogOpen}
        onClose={() => setIsConfirmDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Conferma Eliminazione"
        description={`Sei sicuro di voler eliminare l'operatore ${selectedOperatore?.nome} ${selectedOperatore?.cognome}? Questa azione non può essere annullata.`}
      />
    </div>
  );
}