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
import { Fornitore } from "@/lib/anagrafiche-data";
import { FornitoriEditDialog } from "./FornitoriEditDialog"; // Corrected import name
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { fetchFornitori } from "@/lib/data-fetching";

interface FornitoriTableProps {
  data: Fornitore[];
  isLoading: boolean;
  onRefresh: () => void;
}

export function FornitoriTable({
  data,
  isLoading,
  onRefresh,
}: FornitoriTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [selectedFornitore, setSelectedFornitore] =
    useState<Fornitore | null>(null);

  const columns: ColumnDef<Fornitore>[] = useMemo(
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
        accessorKey: "partita_iva",
        header: "Partita IVA",
      },
      {
        accessorKey: "codice_fiscale",
        header: "Codice Fiscale",
      },
      {
        accessorKey: "citta",
        header: "Città",
      },
      {
        accessorKey: "email",
        header: "Email",
      },
      {
        accessorKey: "attivo",
        header: "Attivo",
        cell: ({ row }) => (
          <div className="text-center">
            {row.getValue("attivo") ? "Sì" : "No"}
          </div>
        ),
      },
      {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => {
          const fornitore = row.original;
          return (
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleEdit(fornitore)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(fornitore)}
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
    setSelectedFornitore(null);
    setIsEditDialogOpen(true);
  };

  const handleEdit = (fornitore: Fornitore) => {
    setSelectedFornitore(fornitore);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (fornitore: Fornitore) => {
    setSelectedFornitore(fornitore);
    setIsConfirmDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (selectedFornitore) {
      const { error } = await supabase
        .from("fornitori")
        .delete()
        .eq("id", selectedFornitore.id);

      if (error) {
        showError(`Errore durante l'eliminazione: ${error.message}`);
      } else {
        showSuccess("Fornitore eliminato con successo!");
        onRefresh();
      }
      setIsConfirmDialogOpen(false);
      setSelectedFornitore(null);
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
          <PlusCircle className="mr-2 h-4 w-4" /> Aggiungi Fornitore
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
                  Caricamento fornitori...
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
                  Nessun fornitore trovato.
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

      <FornitoriEditDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        fornitore={selectedFornitore}
        onSaveSuccess={onRefresh}
      />

      <ConfirmDialog
        isOpen={isConfirmDialogOpen}
        onClose={() => setIsConfirmDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Conferma Eliminazione"
        description={`Sei sicuro di voler eliminare il fornitore ${selectedFornitore?.nome}? Questa azione non può essere annullata.`}
      />
    </div>
  );
}