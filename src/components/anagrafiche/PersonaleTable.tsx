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
import { format } from "date-fns";
import { it } from 'date-fns/locale';
import { Edit, Trash2, RefreshCcw } from "lucide-react";
import { showInfo, showError, showSuccess } from "@/utils/toast";
import { supabase } from "@/integrations/supabase/client";
import { Personale } from "@/lib/anagrafiche-data";

export function PersonaleTable() {
  const [data, setData] = useState<Personale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchPersonaleData = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('personale')
      .select('id, created_at, nome, cognome, codice_fiscale, ruolo, telefono, email, data_nascita, luogo_nascita, indirizzo, cap, citta, provincia, data_assunzione, data_cessazione, attivo, note');

    if (error) {
      showError(`Errore nel recupero del personale: ${error.message}`);
      console.error("Error fetching personale:", error);
      setData([]);
    } else {
      setData(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPersonaleData();
  }, [fetchPersonaleData]);

  const handleEdit = (personale: Personale) => {
    showInfo(`Modifica personale: ${personale.nome} ${personale.cognome} (ID: ${personale.id})`);
    // Qui potresti aprire un dialog di modifica o navigare a una pagina di modifica
  };

  const handleDelete = async (personaleId: string, nomeCognome: string) => {
    if (window.confirm(`Sei sicuro di voler eliminare il personale "${nomeCognome}"?`)) {
      const { error } = await supabase
        .from('personale')
        .delete()
        .eq('id', personaleId);

      if (error) {
        showError(`Errore durante l'eliminazione del personale: ${error.message}`);
        console.error("Error deleting personale:", error);
      } else {
        showSuccess(`Personale "${nomeCognome}" eliminato con successo!`);
        fetchPersonaleData(); // Refresh data after deletion
      }
    } else {
      showInfo(`Eliminazione del personale "${nomeCognome}" annullata.`);
    }
  };

  const filteredData = useMemo(() => {
    return data.filter(personale => {
      const searchLower = searchTerm.toLowerCase();
      return (
        personale.nome.toLowerCase().includes(searchLower) ||
        personale.cognome.toLowerCase().includes(searchLower) ||
        (personale.codice_fiscale?.toLowerCase().includes(searchLower)) ||
        (personale.ruolo?.toLowerCase().includes(searchLower)) ||
        (personale.email?.toLowerCase().includes(searchLower))
      );
    });
  }, [data, searchTerm]);

  const columns: ColumnDef<Personale>[] = useMemo(() => [
    {
      accessorKey: "nome",
      header: "Nome",
    },
    {
      accessorKey: "cognome",
      header: "Cognome",
    },
    {
      accessorKey: "ruolo",
      header: "Ruolo",
    },
    {
      accessorKey: "codice_fiscale",
      header: "Codice Fiscale",
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
      accessorKey: "data_assunzione",
      header: "Data Assunzione",
      cell: ({ row }) => row.original.data_assunzione ? format(new Date(row.original.data_assunzione), "PPP", { locale: it }) : 'N/A',
    },
    {
      accessorKey: "attivo",
      header: "Attivo",
      cell: ({ row }) => (row.original.attivo ? "Sì" : "No"),
    },
    {
      id: "actions",
      header: "Azioni",
      cell: ({ row }) => (
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={() => handleEdit(row.original)} title="Modifica">
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="destructive" size="sm" onClick={() => handleDelete(row.original.id, `${row.original.nome} ${row.original.cognome}`)} title="Elimina">
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
          placeholder="Cerca per nome, cognome, ruolo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Button variant="outline" onClick={fetchPersonaleData} disabled={loading}>
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
                  Caricamento personale...
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
                  Nessun personale trovato.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}