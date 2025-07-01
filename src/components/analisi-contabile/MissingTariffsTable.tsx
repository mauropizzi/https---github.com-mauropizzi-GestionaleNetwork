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
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface MissingTariffEntry {
  serviceId: string;
  serviceType: string;
  clientName: string;
  clientId: string;
  servicePointName?: string;
  servicePointId?: string;
  fornitoreId?: string;
  startDate: string;
  endDate: string;
  reason: string;
}

interface MissingTariffsTableProps {
  data: MissingTariffEntry[];
  loading: boolean;
}

export const MissingTariffsTable: React.FC<MissingTariffsTableProps> = ({ data, loading }) => {
  const navigate = useNavigate();

  const handleInsertTariff = (entry: MissingTariffEntry) => {
    const queryParams = new URLSearchParams();
    queryParams.append("tab", "nuova-tariffa");
    queryParams.append("clientId", entry.clientId);
    queryParams.append("serviceType", entry.serviceType);
    if (entry.servicePointId) {
      queryParams.append("servicePointId", entry.servicePointId);
    }
    if (entry.fornitoreId) {
      queryParams.append("fornitoreId", entry.fornitoreId);
    }
    queryParams.append("startDate", entry.startDate);
    queryParams.append("endDate", entry.endDate);

    navigate(`/anagrafiche/tariffe?${queryParams.toString()}`);
  };

  const columns: ColumnDef<MissingTariffEntry>[] = React.useMemo(() => [
    {
      accessorKey: "serviceType",
      header: "Tipo Servizio",
      cell: ({ row }) => <span>{row.original.serviceType}</span>,
    },
    {
      accessorKey: "clientName",
      header: "Cliente",
      cell: ({ row }) => <span>{row.original.clientName}</span>,
    },
    {
      accessorKey: "servicePointName",
      header: "Punto Servizio",
      cell: ({ row }) => <span>{row.original.servicePointName || 'N/A'}</span>,
    },
    {
      accessorKey: "startDate",
      header: "Data Inizio Servizio",
      cell: ({ row }) => <span>{row.original.startDate}</span>,
    },
    {
      accessorKey: "reason",
      header: "Motivo",
      cell: ({ row }) => <span>{row.original.reason}</span>,
    },
    {
      id: "actions",
      header: "Azioni",
      cell: ({ row }) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleInsertTariff(row.original)}
          title="Inserisci Tariffa"
        >
          <PlusCircle className="h-4 w-4 mr-2" /> Inserisci Tariffa
        </Button>
      ),
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