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
import { ArrowUpDown, Eye } from "lucide-react";
import { CantiereReport } from "@/lib/cantiere-data"; // Corrected import

interface CantiereHistoryTableProps {
  data: CantiereReport[];
  isLoading: boolean;
  onViewDetails: (reportId: string) => void;
}

export function CantiereHistoryTable({
  data,
  isLoading,
  onViewDetails,
}: CantiereHistoryTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const columns: ColumnDef<CantiereReport>[] = useMemo(
    () => [
      {
        accessorKey: "report_date",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Data Rapporto
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => <div>{new Date(row.getValue("report_date") as string).toLocaleDateString()}</div>,
      },
      {
        accessorKey: "report_time",
        header: "Ora Rapporto",
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
        accessorKey: "punti_servizio", // Access the nested object
        header: "Punto Servizio / Cantiere",
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
        accessorKey: "personale", // Access the nested object
        header: "Addetto Security Service",
        cell: ({ cell }) => {
          const personale = cell.getValue() as { nome: string; cognome: string } | null;
          return (
            <div>
              {personale ? `${personale.nome} ${personale.cognome}` : "N/A"}
            </div>
          );
        },
        enableSorting: false,
        enableColumnFilter: false,
      },
      {
        accessorKey: "service_provided",
        header: "Servizio",
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <div className="capitalize">{row.getValue("status")}</div>,
      },
      {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => (
          <Button variant="ghost" size="icon" onClick={() => onViewDetails(row.original.id)}>
            <Eye className="h-4 w-4" />
          </Button>
        ),
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

  return (
    <div className="w-full">
      <div className="flex items-center py-4">
        <Input
          placeholder="Cerca per cliente..."
          value={(table.getColumn("clienti")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("clienti")?.setFilterValue(event.target.value)
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
                  Caricamento rapporti...
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
                  Nessun rapporto trovato.
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