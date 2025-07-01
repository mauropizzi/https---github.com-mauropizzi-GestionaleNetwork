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

interface MissingTariffEntry {
  serviceId: string;
  serviceType: string;
  clientName: string;
  servicePointName?: string;
  startDate: string;
  reason: string;
}

interface MissingTariffsTableProps {
  data: MissingTariffEntry[];
  loading: boolean;
}

export const MissingTariffsTable: React.FC<MissingTariffsTableProps> = ({ data, loading }) => {
  const columns: ColumnDef<MissingTariffEntry>[] = React.useMemo(() => [
    {
      accessorKey: "serviceId",
      header: "ID Servizio",
    },
    {
      accessorKey: "serviceType",
      header: "Tipo Servizio",
    },
    {
      accessorKey: "clientName",
      header: "Cliente",
    },
    {
      accessorKey: "servicePointName",
      header: "Punto Servizio",
    },
    {
      accessorKey: "startDate",
      header: "Data Inizio Servizio",
    },
    {
      accessorKey: "reason",
      header: "Motivo",
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
                Caricamento tariffe mancanti...
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
                Nessuna tariffa mancante trovata.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};