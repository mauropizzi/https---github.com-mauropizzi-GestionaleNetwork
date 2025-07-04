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
import { ArrowUpDown } from "lucide-react";
import { Canone } from "@/lib/canone-data"; // Corrected import path

interface CanoneTableProps {
  data: Canone[];
  isLoading: boolean;
  onRefresh: () => void;
}

export function CanoneTable({ data, isLoading, onRefresh }: CanoneTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const columns: ColumnDef<Canone>[] = useMemo(
    () => [
      {
        accessorKey: "data_inizio",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Data Inizio
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => <div>{new Date(row.getValue("data_inizio") as string).toLocaleDateString()}</div>,
      },
      {
        accessorKey: "data_fine",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Data Fine
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => <div>{new Date(row.getValue("data_fine") as string).toLocaleDateString()}</div>,
      },
      {
        accessorKey: "punti_servizio", // Access the nested object
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
        enableColumnFilter: false,
      },
      {
        accessorKey: "fornitori", // Access the nested object
        header: "Fornitore",
        cell: ({ cell }) => {
          const fornitori = cell.getValue() as { nome: string } | null;
          return (
            <div>
              {fornitori?.nome || "N/A"}
            </div>
          );
        },
        enableSorting: false,
        enableColumnFilter: false,
      },
      {
        accessorKey: "clienti", // Access the nested object
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
        enableColumnFilter: false,
      },
      {
        accessorKey: "importo",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Importo
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => <div>€{parseFloat(row.getValue("importo")).toFixed(2)}</div>,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <div className="capitalize">{row.getValue("status")}</div>,
      },
      // Add actions column if needed
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

  return (
    <div className="w-full">
      <div className="flex items-center py-4">
        <Input
          placeholder="Cerca per punto servizio..."
          value={(table.getColumn("punti_servizio")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("punti_servizio")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        {/* Add other filters or buttons here */}
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
                  Caricamento canoni...
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
                  Nessun canone trovato.
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
    </div>
  );
}