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
import { Fornitore } from "@/lib/anagrafiche-data";
import { FornitoreEditDialog } from "./FornitoreEditDialog"; // Corrected import

export function FornitoriTable() {
  const [data, setData] = useState<Fornitore[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedFornitoreForEdit, setSelectedFornitoreForEdit] = useState<Fornitore | null>(null);

  const fetchFornitoriData = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('fornitori')
      .select('id, created_at, nome_fornitore, partita_iva, codice_fiscale, referente, telefono, email, tipo_fornitura, indirizzo, cap, citta, provincia, pec, attivo, note');

    if (error) {
      showError(`Errore nel recupero dei fornitori: ${error.message}`);
      console.error("Error fetching fornitori:", error);
      setData([]);
    } else {
      setData(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchFornitoriData();
  }, [fetchFornitoriData]);

  const handleEdit = useCallback((fornitore: Fornitore) => {
    setSelectedFornitoreForEdit(fornitore);
    setIsEditDialogOpen(true);
  }, []);

  const handleSaveEdit = useCallback(() => { // Removed updatedFornitore parameter as it's not used directly here
    // The dialog's onSaveSuccess will trigger a re-fetch, ensuring data consistency.
    fetchFornitoriData(); 
    setIsEditDialogOpen(false);
    setSelectedFornitoreForEdit(null);
  }, [fetchFornitoriData]);

  const handleCloseDialog = useCallback(() => {
    setIsEditDialogOpen(false);
    setSelectedFornitoreForEdit(null);
  }, []);

  const handleDelete = async (fornitoreId: string, nomeFornitore: string) => {
    if (window.confirm(`Sei sicuro di voler eliminare il fornitore "${nomeFornitore}"?`)) {
      const { error } = await supabase
        .from('fornitori')
        .delete()
        .eq('id', fornitoreId);

      if (error) {
        showError(`Errore durante l'eliminazione del fornitore: ${error.message}`);
        console.error("Error deleting fornitore:", error);
      } else {
        showSuccess(`Fornitore "${nomeFornitore}" eliminato con successo!`);
        fetchFornitoriData(); // Refresh data after deletion
      }
    } else {
      showInfo(`Eliminazione del fornitore "${nomeFornitore}" annullata.`);
    }
  };

  const filteredData = useMemo(() => {
    return data.filter(fornitore => {
      const searchLower = searchTerm.toLowerCase();
      return (
        fornitore.nome_fornitore.toLowerCase().includes(searchLower) ||
        (fornitore.partita_iva?.toLowerCase().includes(searchLower)) ||
        (fornitore.codice_fiscale?.toLowerCase().includes(searchLower)) ||
        (fornitore.citta?.toLowerCase().includes(searchLower)) ||
        (fornitore.email?.toLowerCase().includes(searchLower)) ||
        (fornitore.tipo_fornitura?.toLowerCase().includes(searchLower))
      );
    });
  }, [data, searchTerm]);

  const columns: ColumnDef<Fornitore>[] = useMemo(() => [
    {
      accessorKey: "nome_fornitore",
      header: "Nome Fornitore",
      cell: ({ row }) => <span>{row.original.nome_fornitore}</span>,
    },
    {
      accessorKey: "partita_iva",
      header: "Partita IVA",
      cell: ({ row }) => <span>{row.original.partita_iva || 'N/A'}</span>,
    },
    {
      accessorKey: "codice_fiscale",
      header: "Codice Fiscale",
      cell: ({ row }) => <span>{row.original.codice_fiscale || 'N/A'}</span>,
    },
    {
      accessorKey: "citta",
      header: "Città",
      cell: ({ row }) => <span>{row.original.citta || 'N/A'}</span>,
    },
    {
      accessorKey: "telefono",
      header: "Telefono",
      cell: ({ row }) => <span>{row.original.telefono || 'N/A'}</span>,
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => <span>{row.original.email || 'N/A'}</span>,
    },
    {
      accessorKey: "tipo_fornitura",
      header: "Tipo Fornitura",
      cell: ({ row }) => <span>{row.original.tipo_fornitura || 'N/A'}</span>,
    },
    {
      accessorKey: "attivo",
      header: "Attivo",
      cell: ({ row }) => <span>{row.original.attivo ? "Sì" : "No"}</span>,
    },
    {
      id: "actions",
      header: "Azioni",
      cell: ({ row }) => (
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={() => handleEdit(row.original)} title="Modifica">
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="destructive" size="sm" onClick={() => handleDelete(row.original.id, row.original.nome_fornitore)} title="Elimina">
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
          placeholder="Cerca per nome, P.IVA, città..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Button variant="outline" onClick={fetchFornitoriData} disabled={loading}>
          <RefreshCcw className="mr-2 h-4 w-4" /> {loading ? 'Caricamento...' : 'Aggiorna Dati'}
        </Button>
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
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Caricamento fornitori...
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
                  Nessun fornitore trovato.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {selectedFornitoreForEdit && (
        <FornitoreEditDialog
          isOpen={isEditDialogOpen}
          onClose={handleCloseDialog}
          fornitore={selectedFornitoreForEdit}
          onSaveSuccess={handleSaveEdit}
        />
      )}
    </div>
  );
}