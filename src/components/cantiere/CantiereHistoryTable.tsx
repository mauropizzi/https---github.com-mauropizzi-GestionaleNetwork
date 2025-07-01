import React, { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { it } from 'date-fns/locale';
import { Mail, Printer, RotateCcw, Search } from "lucide-react";
import { showInfo } from "@/utils/toast";

interface CantiereReport {
  id: string;
  reportDate: Date;
  cliente: string;
  cantiere: string;
  addetto: string;
  servizio: string;
  oreServizio: number;
  descrizioneLavori: string;
  automezziCount: number;
  attrezziCount: number;
}

// Mock data for demonstration
const mockCantiereReports: CantiereReport[] = [
  {
    id: "CR001",
    reportDate: new Date(2024, 6, 20),
    cliente: "AEROVIAGGI SPA",
    cantiere: "Cantiere Palermo Centro",
    addetto: "639 ABBATE EMANUELE",
    servizio: "Guardia Particolare Giurata",
    oreServizio: 8,
    descrizioneLavori: "Sorveglianza perimetrale e controllo accessi.",
    automezziCount: 1,
    attrezziCount: 0,
  },
  {
    id: "CR002",
    reportDate: new Date(2024, 6, 21),
    cliente: "COSEDIL SPA",
    cantiere: "Nuova Costruzione Catania",
    addetto: "2 GRASSO DAVIDE",
    servizio: "Addetto Servizi Fiduciari con Auto",
    oreServizio: 10,
    descrizioneLavori: "Ronda interna e verifica impianti.",
    automezziCount: 1,
    attrezziCount: 2,
  },
  {
    id: "CR003",
    reportDate: new Date(2024, 6, 22),
    cliente: "F.LLI MAMMANA SRL",
    cantiere: "Ristrutturazione Agrigento",
    addetto: "14 BALISTRERI GIOVANNI",
    servizio: "Guardia Particolare Giurata",
    oreServizio: 6,
    descrizioneLavori: "Controllo materiali in entrata/uscita.",
    automezziCount: 0,
    attrezziCount: 1,
  },
];

const columns: ColumnDef<CantiereReport>[] = [
  {
    accessorKey: "reportDate",
    header: "Data Rapporto",
    cell: ({ row }) => <span>{format(row.original.reportDate, "PPP", { locale: it })}</span>,
  },
  {
    accessorKey: "cliente",
    header: "Cliente",
    cell: ({ row }) => <span>{row.original.cliente}</span>,
  },
  {
    accessorKey: "cantiere",
    header: "Cantiere",
    cell: ({ row }) => <span>{row.original.cantiere}</span>,
  },
  {
    accessorKey: "addetto",
    header: "Addetto",
    cell: ({ row }) => <span>{row.original.addetto}</span>,
  },
  {
    accessorKey: "servizio",
    header: "Servizio",
    cell: ({ row }) => <span>{row.original.servizio}</span>,
  },
  {
    accessorKey: "oreServizio",
    header: "Ore",
    cell: ({ row }) => <span>{row.original.oreServizio}</span>,
  },
  {
    accessorKey: "automezziCount",
    header: "Automezzi",
    cell: ({ row }) => <span>{row.original.automezziCount}</span>,
  },
  {
    accessorKey: "attrezziCount",
    header: "Attrezzi",
    cell: ({ row }) => <span>{row.original.attrezziCount}</span>,
  },
  {
    id: "actions",
    header: "Azioni",
    cell: ({ row }) => (
      <div className="flex space-x-2">
        <Button variant="outline" size="sm" onClick={() => showInfo(`Invio email per CR${row.original.id}`)}>
          <Mail className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={() => showInfo(`Stampa PDF per CR${row.original.id}`)}>
          <Printer className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={() => showInfo(`Ripristino dati per CR${row.original.id}`)}>
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>
    ),
  },
];

export function CantiereHistoryTable() {
  const [data, setData] = useState<CantiereReport[]>(mockCantiereReports);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDate, setFilterDate] = useState<string>("");

  const filteredData = data.filter(report => {
    const matchesSearch = searchTerm === "" ||
      report.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.cantiere.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.addetto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.servizio.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.descrizioneLavori.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDate = filterDate === "" ||
      format(report.reportDate, "yyyy-MM-dd") === filterDate;

    return matchesSearch && matchesDate;
  });

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        <Input
          placeholder="Cerca per cliente, cantiere, addetto..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="max-w-xs"
        />
        <Button variant="outline" onClick={() => { setSearchTerm(""); setFilterDate(""); }}>
          Reset Filtri
        </Button>
      </div>
      <div className="rounded-md border overflow-x-auto">
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
                  Nessun risultato.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}