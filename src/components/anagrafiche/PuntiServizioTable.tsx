import React, { useState, useEffect, useMemo, useCallback } from "react";
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
import { Edit, Trash2, RefreshCcw } from "lucide-react";
import { showInfo, showError, showSuccess } from "@/utils/toast";
import { supabase } from "@/integrations/supabase/client";
import { PuntoServizio, Cliente, Fornitore } from "@/lib/anagrafiche-data";
import { fetchClienti, fetchFornitori } from "@/lib/data-fetching";

interface PuntoServizioExtended extends PuntoServizio {
  nome_cliente?: string;
  nome_fornitore?: string;
}

export function PuntiServizioTable() {
  const [data, setData] = useState<PuntoServizioExtended[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [clientiMap, setClientiMap] = useState<Map<string, string>>(new Map());
  const [fornitoriMap, setFornitoriMap] = useState<Map<string, string>>(new Map());

  const fetchPuntiServizioData = useCallback(async () => {
    setLoading(true);
    const { data: puntiServizioData, error: puntiServizioError } = await supabase
      .from('punti_servizio')
      .select('*, clienti(nome_cliente), fornitori(nome_fornitore)'); // Fetch related client and supplier names

    if (puntiServizioError) {
      showError(`Errore nel recupero dei punti servizio: ${puntiServizioError.message}`);
      console.error("Error fetching punti_servizio:", puntiServizioError);
      setData([]);
    } else {
      const mappedData = puntiServizioData.map(ps => ({
        ...ps,
        nome_cliente: ps.clienti?.nome_cliente || 'N/A',
        nome_fornitore: ps.fornitori?.nome_fornitore || 'N/A',
      }));
      setData(mappedData || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPuntiServizioData();
  }, [fetchPuntiServizioData]);

  const handleEdit = (puntoServizio: PuntoServizioExtended) => {
    showInfo(`Modifica punto servizio: ${puntoServizio.nome_punto_servizio} (ID: ${puntoServizio.id})`);
    // Qui potresti aprire un dialog di modifica o navigare a una pagina di modifica
  };

  const handleDelete = async (puntoServizioId: string, nomePuntoServizio: string) => {
    if (window.confirm(`Sei sicuro di voler eliminare il punto servizio "${nomePuntoServizio}"?`)) {
      const { error } = await supabase
        .from('punti_servizio')
        .delete()
        .eq('id', puntoServizioId);

      if (error) {
        showError(`Errore durante l'eliminazione del punto servizio: ${error.message}`);
        console.error("Error deleting punto_servizio:", error);
      } else {
        showSuccess(`Punto servizio "${nomePuntoServizio}" eliminato con successo!`);
        fetchPuntiServizioData(); // Refresh data after deletion
      }
    } else {
      showInfo(`Eliminazione del punto servizio "${nomePuntoServizio}" annullata.`);
    }
  };

  const filteredData = useMemo(() => {
    return data.filter(punto => {
      const searchLower = searchTerm.toLowerCase();
      return (
        punto.nome_punto_servizio.toLowerCase().includes(searchLower) ||
        (punto.nome_cliente?.toLowerCase().includes(searchLower)) ||
        (punto.indirizzo?.toLowerCase().includes(searchLower)) ||
        (punto.citta?.toLowerCase().includes(searchLower)) ||
        (punto.referente?.toLowerCase().includes(searchLower))
      );
    });
  }, [data, searchTerm]);

  const columns: ColumnDef<PuntoServizioExtended>[] = useMemo(() => [
    {
      accessorKey: "nome_punto_servizio",
      header: "Nome Punto Servizio",
    },
    {
      accessorKey: "nome_cliente",
      header: "Cliente Associato",
    },
    {
      accessorKey: "indirizzo",
      header: "Indirizzo",
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
      accessorKey: "telefono",
      header: "Telefono",
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "tempo_intervento",
      header: "Tempo Intervento (min)",
    },
    {
      accessorKey: "nome_fornitore",
      header: "Fornitore",
    },
    {
      id: "actions",
      header: "Azioni",
      cell: ({ row }) => (
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={() => handleEdit(row.original)} title="Modifica">
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="destructive" size="sm" onClick={() => handleDelete(row.original.id, row.original.nome_punto_servizio)} title="Elimina">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ], [handleEdit, handleDelete]);

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <Input
          placeholder="Cerca per nome, indirizzo, città..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Button variant="outline" onClick={fetchPuntiServizioData} disabled={loading}>
          <RefreshCcw className="mr-2 h-4 w-4" /> {loading ? 'Caricamento...' : 'Aggiorna Dati'}
        </Button>
      </div>

      <div className="rounded-md border">
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
                  Caricamento punti servizio...
                </TableCell>
              </TableRow>
            ) : (table && table.getRowModel().rows?.length) ? (
              table.getRowodel().rows.map((row) => (
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
    </div>
  );
}