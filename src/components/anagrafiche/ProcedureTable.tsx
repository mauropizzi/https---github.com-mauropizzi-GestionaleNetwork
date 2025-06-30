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
import { Edit, Trash2, RefreshCcw, ExternalLink } from "lucide-react";
import { showInfo, showError, showSuccess } from "@/utils/toast";
import { supabase } from "@/integrations/supabase/client";
import { Procedure } from "@/lib/anagrafiche-data";
import { ProcedureEditDialog } from "./ProcedureEditDialog";

export function ProcedureTable() {
  const [data, setData] = useState<Procedure[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedProcedureForEdit, setSelectedProcedureForEdit] = useState<Procedure | null>(null);

  const fetchProcedureData = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('procedure')
      .select('id, created_at, nome_procedura, descrizione, versione, data_ultima_revisione, responsabile, documento_url, attivo, note');

    if (error) {
      showError(`Errore nel recupero delle procedure: ${error.message}`);
      console.error("Error fetching procedure:", error);
      setData([]);
    } else {
      setData(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProcedureData();
  }, [fetchProcedureData]);

  const handleEdit = useCallback((procedure: Procedure) => {
    setSelectedProcedureForEdit(procedure);
    setIsEditDialogOpen(true);
  }, []);

  const handleSaveEdit = useCallback((updatedProcedure: Procedure) => {
    setData(prevData =>
      prevData.map(p =>
        p.id === updatedProcedure.id ? updatedProcedure : p
      )
    );
    fetchProcedureData(); // Re-fetch to ensure data consistency
    setIsEditDialogOpen(false);
    setSelectedProcedureForEdit(null);
  }, [fetchProcedureData]);

  const handleCloseDialog = useCallback(() => {
    setIsEditDialogOpen(false);
    setSelectedProcedureForEdit(null);
  }, []);

  const handleDelete = async (procedureId: string, nomeProcedura: string) => {
    if (window.confirm(`Sei sicuro di voler eliminare la procedura "${nomeProcedura}"?`)) {
      const { error } = await supabase
        .from('procedure')
        .delete()
        .eq('id', procedureId);

      if (error) {
        showError(`Errore durante l'eliminazione della procedura: ${error.message}`);
        console.error("Error deleting procedure:", error);
      } else {
        showSuccess(`Procedura "${nomeProcedura}" eliminata con successo!`);
        fetchProcedureData(); // Refresh data after deletion
      }
    } else {
      showInfo(`Eliminazione della procedura "${nomeProcedura}" annullata.`);
    }
  };

  const filteredData = useMemo(() => {
    return data.filter(procedure => {
      const searchLower = searchTerm.toLowerCase();
      return (
        procedure.nome_procedura.toLowerCase().includes(searchLower) ||
        (procedure.descrizione?.toLowerCase().includes(searchLower)) ||
        (procedure.versione?.toLowerCase().includes(searchLower)) ||
        (procedure.responsabile?.toLowerCase().includes(searchLower))
      );
    });
  }, [data, searchTerm]);

  const columns: ColumnDef<Procedure>[] = useMemo(() => [
    {
      accessorKey: "nome_procedura",
      header: "Nome Procedura",
    },
    {
      accessorKey: "versione",
      header: "Versione",
    },
    {
      accessorKey: "data_ultima_revisione",
      header: "Ultima Revisione",
      cell: ({ row }) => row.original.data_ultima_revisione ? format(new Date(row.original.data_ultima_revisione), "PPP", { locale: it }) : "N/A",
    },
    {
      accessorKey: "responsabile",
      header: "Responsabile",
    },
    {
      accessorKey: "attivo",
      header: "Attiva",
      cell: ({ row }) => (row.original.attivo ? "Sì" : "No"),
    },
    {
      id: "documento_url",
      header: "Documento",
      cell: ({ row }) => (
        row.original.documento_url ? (
          <a href={row.original.documento_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center">
            Visualizza <ExternalLink className="ml-1 h-3 w-3" />
          </a>
        ) : "N/A"
      ),
    },
    {
      id: "actions",
      header: "Azioni",
      cell: ({ row }) => (
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={() => handleEdit(row.original)} title="Modifica">
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="destructive" size="sm" onClick={() => handleDelete(row.original.id, row.original.nome_procedura)} title="Elimina">
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
          placeholder="Cerca per nome, descrizione, responsabile..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Button variant="outline" onClick={fetchProcedureData} disabled={loading}>
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
                  Caricamento procedure...
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
                  Nessuna procedura trovata.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {selectedProcedureForEdit && (
        <ProcedureEditDialog
          isOpen={isEditDialogOpen}
          onClose={handleCloseDialog}
          procedure={selectedProcedureForEdit}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
}