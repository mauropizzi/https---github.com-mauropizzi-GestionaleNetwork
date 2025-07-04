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
import { format, parseISO } from "date-fns";
import { it } from 'date-fns/locale';
import { Edit, Trash2, RefreshCcw } from "lucide-react";
import { showInfo, showError, showSuccess } from "@/utils/toast";
import { supabase } from "@/integrations/supabase/client";
import { ServiziCanone } from "@/lib/anagrafiche-data";
import { CanoneEditDialog } from "./CanoneEditDialog";

interface ServiziCanoneExtended extends ServiziCanone {
  punti_servizio?: { nome_punto_servizio: string } | null;
  fornitori?: { nome_fornitore: string } | null;
  clienti?: { nome_cliente: string } | null;
}

export function CanoneTable() {
  const [data, setData] = useState<ServiziCanoneExtended[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedCanoneForEdit, setSelectedCanoneForEdit] = useState<ServiziCanoneExtended | null>(null);

  const fetchServiziCanoneData = useCallback(async () => {
    setLoading(true);
    const { data: canoneData, error } = await supabase
      .from('servizi_canone')
      .select('id, created_at, service_point_id, fornitore_id, tipo_canone, start_date, end_date, status, notes, client_id, unita_misura, punti_servizio(nome_punto_servizio), fornitori(nome_fornitore), clienti(nome_cliente)'); // Removed calculated_cost

    if (error) {
      showError(`Errore nel recupero dei servizi a canone: ${error.message}`);
      console.error("Error fetching servizi_canone:", error);
      setData([]);
    } else {
      const mappedData = canoneData.map(sc => ({
        ...sc,
        nome_punto_servizio: sc.punti_servizio?.nome_punto_servizio || 'N/A',
        nome_fornitore: sc.fornitori?.nome_fornitore || 'N/A',
        nome_cliente: sc.clienti?.nome_cliente || 'N/A',
      }));
      setData(mappedData || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchServiziCanoneData();
  }, [fetchServiziCanoneData]);

  const handleEdit = useCallback((canone: ServiziCanoneExtended) => {
    setSelectedCanoneForEdit(canone);
    setIsEditDialogOpen(true);
  }, []);

  const handleSaveEdit = useCallback((updatedCanone: ServiziCanone) => {
    // Update local state to reflect changes immediately
    setData(prevData =>
      prevData.map(sc =>
        sc.id === updatedCanone.id ? { ...sc, ...updatedCanone } : sc
      )
    );
    fetchServiziCanoneData(); // Re-fetch to ensure data consistency (e.g., updated names)
    setIsEditDialogOpen(false);
    setSelectedCanoneForEdit(null);
  }, [fetchServiziCanoneData]);

  const handleCloseDialog = useCallback(() => {
    setIsEditDialogOpen(false);
    setSelectedCanoneForEdit(null);
  }, []);

  const handleDelete = async (canoneId: string, tipoCanone: string) => {
    if (window.confirm(`Sei sicuro di voler eliminare il servizio a canone "${tipoCanone}"?`)) {
      const { error } = await supabase
        .from('servizi_canone')
        .delete()
        .eq('id', canoneId);

      if (error) {
        showError(`Errore durante l'eliminazione del servizio a canone: ${error.message}`);
        console.error("Error deleting servizi_canone:", error);
      } else {
        showSuccess(`Servizio a canone "${tipoCanone}" eliminato con successo!`);
        fetchServiziCanoneData(); // Refresh data after deletion
      }
    } else {
      showInfo(`Eliminazione del servizio a canone "${tipoCanone}" annullata.`);
    }
  };

  const filteredData = useMemo(() => {
    return data.filter(canone => {
      const searchLower = searchTerm.toLowerCase();
      return (
        canone.tipo_canone.toLowerCase().includes(searchLower) ||
        (canone.nome_punto_servizio?.toLowerCase().includes(searchLower)) ||
        (canone.nome_fornitore?.toLowerCase().includes(searchLower)) ||
        (canone.nome_cliente?.toLowerCase().includes(searchLower)) ||
        canone.status.toLowerCase().includes(searchLower)
      );
    });
  }, [data, searchTerm]);

  const columns: ColumnDef<ServiziCanoneExtended>[] = useMemo(() => [
    {
      accessorKey: "tipo_canone",
      header: "Tipo Canone",
      cell: ({ row }) => <span>{row.original.tipo_canone}</span>,
    },
    {
      accessorKey: "nome_cliente",
      header: "Cliente",
      cell: ({ row }) => <span>{row.original.nome_cliente}</span>,
    },
    {
      accessorKey: "nome_punto_servizio",
      header: "Punto Servizio",
      cell: ({ row }) => <span>{row.original.nome_punto_servizio}</span>,
    },
    {
      accessorKey: "nome_fornitore",
      header: "Fornitore",
      cell: ({ row }) => <span>{row.original.nome_fornitore || 'N/A'}</span>,
    },
    {
      accessorKey: "start_date",
      header: "Data Inizio",
      cell: ({ row }) => <span>{format(parseISO(row.original.start_date), "PPP", { locale: it })}</span>,
    },
    {
      accessorKey: "end_date",
      header: "Data Fine",
      cell: ({ row }) => <span>{row.original.end_date ? format(parseISO(row.original.end_date), "PPP", { locale: it }) : "N/A"}</span>,
    },
    {
      accessorKey: "status",
      header: "Stato",
      cell: ({ row }) => <span>{row.original.status}</span>,
    },
    {
      id: "actions",
      header: "Azioni",
      cell: ({ row }) => (
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={() => handleEdit(row.original)} title="Modifica">
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="destructive" size="sm" onClick={() => handleDelete(row.original.id, row.original.tipo_canone)} title="Elimina">
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
          placeholder="Cerca per tipo canone, punto servizio, cliente..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Button variant="outline" onClick={fetchServiziCanoneData} disabled={loading}>
          <RefreshCcw className="mr-2 h-4 w-4" /> {loading ? 'Caricamento...' : 'Aggiorna Dati'}
        </Button>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => { // Explicit return here
              return (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => { // Explicit return here
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
              );
            })}
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Caricamento servizi a canone...
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
                  Nessun servizio a canone trovato.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {selectedCanoneForEdit && (
        <CanoneEditDialog
          isOpen={isEditDialogOpen}
          onClose={handleCloseDialog}
          canone={selectedCanoneForEdit}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
}