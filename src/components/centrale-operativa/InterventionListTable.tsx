import React from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

interface Intervention {
  id: string;
  report_date: string;
  report_time: string;
  service_point_code: string;
  request_type: string;
  co_operator?: string;
  operator_client?: string;
  gpg_intervention?: string;
  service_outcome?: string;
  notes?: string;
}

export function InterventionListTable() {
  const columns: ColumnDef<Intervention>[] = [
    {
      accessorKey: 'id',
      header: 'ID',
    },
    {
      accessorKey: 'report_date',
      header: 'Data',
      cell: ({ row }) => format(new Date(row.original.report_date), 'PPP', { locale: it }),
    },
    {
      accessorKey: 'report_time',
      header: 'Ora',
    },
    {
      accessorKey: 'service_point_code',
      header: 'Punto Servizio',
    },
    {
      accessorKey: 'request_type',
      header: 'Tipo Richiesta',
    },
    {
      accessorKey: 'service_outcome',
      header: 'Esito',
    },
  ];

  // Mock data - replace with real data from your API
  const data: Intervention[] = [
    {
      id: '1',
      report_date: '2024-01-01',
      report_time: '10:00',
      service_point_code: '0107208',
      request_type: 'Intervento',
      service_outcome: 'Completato',
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <Input
          placeholder="Cerca per ID..."
          className="max-w-sm"
        />
        <Input
          type="date"
          className="max-w-xs"
        />
      </div>

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
            {table.getRowModel().rows?.length ? (
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
                  Nessun intervento trovato.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}