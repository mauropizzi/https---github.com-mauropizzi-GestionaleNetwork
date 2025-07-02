import React from 'react';
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

interface ServiceSummary {
  servicePointId: string;
  servicePointName: string;
  serviceType: string; // Added serviceType
  totalServices: number;
  totalHours: number; // This will now represent total units (hours, interventions, months)
  totalClientCost: number;
  totalSupplierCost: number;
  costDelta: number;
}

interface ServiceSummaryTableProps {
  data: ServiceSummary[];
  loading: boolean;
}

export const ServiceSummaryTable: React.FC<ServiceSummaryTableProps> = ({ data, loading }) => {
  const columns: ColumnDef<ServiceSummary>[] = React.useMemo(() => [
    {
      accessorKey: "servicePointName",
      header: "Punto Servizio",
      cell: ({ row }) => <span>{row.original.servicePointName}</span>,
    },
    {
      accessorKey: "serviceType", // New column
      header: "Tipologia Servizio",
      cell: ({ row }) => <span>{row.original.serviceType}</span>,
    },
    {
      accessorKey: "totalServices",
      header: "Totale Servizi",
      cell: ({ row }) => <span>{row.original.totalServices}</span>,
    },
    {
      accessorKey: "totalHours",
      header: "Quantità Totale (Ore/Interventi/Mesi)", // Updated header
      cell: ({ row }) => <span>{row.original.totalHours.toFixed(2)}</span>,
    },
    {
      accessorKey: "totalClientCost",
      header: "Costo Cliente (€)",
      cell: ({ row }) => <span>{`${row.original.totalClientCost.toFixed(2)} €`}</span>,
    },
    {
      accessorKey: "totalSupplierCost",
      header: "Costo Fornitore (€)",
      cell: ({ row }) => <span>{`${row.original.totalSupplierCost.toFixed(2)} €`}</span>,
    },
    {
      accessorKey: "costDelta",
      header: "Delta (€)",
      cell: ({ row }) => {
        const delta = row.original.costDelta;
        const deltaClass = delta >= 0 ? "text-green-600" : "text-red-600";
        return <span className={deltaClass}>{delta.toFixed(2)} €</span>;
      },
    },
  ], []);

  const table = useReactTable({
    data: data,
    columns: columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                Caricamento dati di analisi...
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
                Nessun dato di servizio trovato per i criteri selezionati.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};