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
import { PlusCircle, ArrowUpDown, Edit, Trash2, Eye } from "lucide-react";
import { PuntoServizio } from "@/lib/anagrafiche-data";
import { PuntoServizioEditDialog } from "./PuntiServizioEditDialog";
import { PuntoServizioDetailsDialog } from "./PuntiServizioDetailsDialog"; // Corrected import name
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";

interface PuntiServizioTableProps {
  data: PuntoServizio[];
  isLoading: boolean;
  onRefresh: () => void;
}

export function PuntiServizioTable({
  data,
  isLoading,
  onRefresh,
}: PuntiServizioTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [selectedPuntoServizio, setSelectedPuntoServizio] =
    useState<PuntoServizio | null>(null);

  const columns: ColumnDef<PuntoServizio>[] = useMemo(
    () => [
      {
        accessorKey: "nome_punto_servizio",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Nome Punto Servizio
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="capitalize">{row.getValue("nome_punto_servizio")}</div>
        ),
      },
      {
        accessorKey: "clienti", // Access the nested object
        header: "Cliente",
        cell: ({ cell }) => {
          const cliente = cell.getValue() as { nome_cliente: string } | null;
          return <div>{cliente?.nome_cliente || "N/A"}</div>;
        },
        enableSorting: false,
        enableColumnFilter: false,
      },
      {
        accessorKey: "fornitori", // Access the nested object
        header: "Fornitore",
        cell: ({ cell }) => {
          const fornitore = cell.getValue() as { nome: string } | null;
          return <div>{fornitore?.nome || "N/A"}</div>;
        },
        enableSorting: false,
        enableColumnFilter: false,
      },
      {
        accessorKey: "citta",
        header: "Città",
      },
      {
        accessorKey: "referente",
        header: "Referente",
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
          const puntoServizio = row.original;
          return (
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleViewDetails(puntoServizio)}
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleEdit(puntoServizio)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(puntoServizio)}
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
    setSelectedPuntoServizio(null);
    setIsEditDialogOpen(true);
  };

  const handleEdit = (puntoServizio: PuntoServizio) => {
    setSelectedPuntoServizio(puntoServizio);
    setIsEditDialogOpen(true);
  };

  const handleViewDetails = (puntoServizio: PuntoServizio) => {
    setSelectedPuntoServizio(puntoServizio);
    setIsDetailsDialogOpen(true);
  };

  const handleDelete = (puntoServizio: PuntoServizio) => {
    setSelectedPuntoServizio(puntoServizio);
    setIsConfirmDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (selectedPuntoServizio) {
      const { error } = await supabase
        .from("punti_servizio")
        .delete()
        .eq("id", selectedPuntoServizio.id);

      if (error) {
        showError(`Errore durante l'eliminazione: ${error.message}`);
      } else {
        showSuccess("Punto Servizio eliminato con successo!");
        onRefresh();
      }
      setIsConfirmDialogOpen(false);
      setSelectedPuntoServizio(null);
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center py-4">
        <Input
          placeholder="Cerca per nome..."
          value={
            (table.getColumn("nome_punto_servizio")?.getFilterValue() as string) ??
            ""
          }
          onChange={(event) =>
            table
              .getColumn("nome_punto_servizio")
              ?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <Button onClick={handleAdd} className="ml-auto">
          <PlusCircle className="mr-2 h-4 w-4" /> Aggiungi Punto Servizio
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
                  Caricamento punti servizio...
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
                  Nessun punto servizio trovato.
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

      <PuntoServizioEditDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        puntoServizio={selectedPuntoServizio}
        onSaveSuccess={onRefresh}
      />

      <PuntoServizioDetailsDialog
        isOpen={isDetailsDialogOpen}
        onClose={() => setIsDetailsDialogOpen(false)}
        puntoServizioId={selectedPuntoServizio?.id || null}
      />

      <ConfirmDialog
        isOpen={isConfirmDialogOpen}
        onClose={() => setIsConfirmDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Conferma Eliminazione"
        description={`Sei sicuro di voler eliminare il punto servizio ${selectedPuntoServizio?.nome_punto_servizio}? Questa azione non può essere annullata.`}
      />
    </div>
  );
}