"use client";

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
import { ServiziCanone } from "@/lib/anagrafiche-data";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { CanoneEditDialog } from "./CanoneEditDialog"; // Correctly import CanoneEditDialog

// Extend ServiziCanone to include joined data
interface ServiziCanoneExtended extends ServiziCanone {
  punti_servizio: { nome_punto_servizio: string } | null;
  fornitori: { nome_fornitore: string } | null;
  clienti: { nome_cliente: string } | null;
}

export function CanoneTable() {
  const [data, setData] = useState<ServiziCanoneExtended[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedCanoneForEdit, setSelectedCanoneForEdit] = useState<ServiziCanone | null>(null);

  const fetchServiziCanone = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('servizi_canone')
      .select('*, punti_servizio(nome_punto_servizio), fornitori(nome_fornitore), clienti(nome_cliente)')
      .order('start_date', { ascending: false });

    if (error) {
      showError(`Errore nel recupero dei servizi a canone: ${error.message}`);
      console.error("Error fetching servizi canone:", error);
      setData([]);
    } else {
      const mappedData: ServiziCanoneExtended[] = data.map(sc => ({
        ...sc,
        punti_servizio: sc.punti_servizio || null,
        fornitori: sc.fornitori || null,
        clienti: sc.clienti || null,
      }));
      setData(mappedData);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchServiziCanone();
  }, [fetchServiziCanone]);

  const handleEdit = useCallback((canone: ServiziCanone) => {
    setSelectedCanoneForEdit(canone);
    setIsEditDialogOpen(true);
  }, []);

  const handleSaveEdit = useCallback(() => {
    fetchServiziCanone(); // Refresh data after save
    setIsEditDialogOpen(false);
    setSelectedCanoneForEdit(null);
  }, [fetchServiziCanone]);

  const handleCloseDialog = useCallback(() => {
    setIsEditDialogOpen(false);
    setSelectedCanoneForEdit(null);
  }, []);

  const handleDelete = async (canoneId: string, canoneDescription: string) => {
    if (window.confirm(`Sei sicuro di voler eliminare il servizio a canone "${canoneDescription}"?`)) {
      const { error } = await supabase
        .from('servizi_canone')
        .delete()
        .eq('id', canoneId);

      if (error) {
        showError(`Errore durante l'eliminazione del servizio a canone: ${error.message}`);
        console.error("Error deleting servizio canone:", error);
      } else {
        showSuccess(`Servizio a canone "${canoneDescription}" eliminato con successo!`);
        fetchServiziCanone(); // Refresh data after deletion
      }
    } else {
      showInfo(`Eliminazione del servizio a canone "${canoneDescription}" annullata.`);
    }
  };

  const filteredData = useMemo(() => {
    return data.filter(canone => {
      const searchLower = searchTerm.toLowerCase();
      return (
        canone.tipo_canone.toLowerCase().includes(searchLower) ||
        (canone.punti_servizio?.nome_punto_servizio?.toLowerCase().includes(searchLower)) ||
        (canone.fornitori?.nome_fornitore?.toLowerCase().includes(searchLower)) ||
        (canone.clienti?.nome_cliente?.toLowerCase().includes(searchLower)) ||
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
      accessorKey: "service_point_id",
      header: "Punto Servizio",
      cell: ({ row }) => <span>{row.original.punti_servizio?.nome_punto_servizio || 'N/A'}</span>,
    },
    {
      accessorKey: "fornitore_id",
      header: "Fornitore",
      cell: ({ row }) => <span>{row.original.fornitori?.nome_fornitore || 'N/A'}</span>,
    },
    {
      accessorKey: "client_id",
      header: "Cliente",
      cell: ({ row }) => <span>{row.original.clienti?.nome_cliente || 'N/A'}</span>,
    },
    {
      accessorKey: "start_date",
      header: "Data Inizio",
      cell: ({ row }) => <span>{new Date(row.original.start_date).toLocaleDateString()}</span>,
    },
    {
      accessorKey: "end_date",
      header: "Data Fine",
      cell: ({ row }) => <span>{row.original.end_date ? new Date(row.original.end_date).toLocaleDateString() : 'N/A'}</span>,
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
          <Button variant="destructive" size="sm" onClick={() => handleDelete(row.original.id!, row.original.tipo_canone)} title="Elimina">
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
          placeholder="Cerca per tipo canone, punto servizio, fornitore, cliente..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Button variant="outline" onClick={fetchServiziCanone} disabled={loading}>
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
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Modifica Servizio a Canone</DialogTitle>
              <DialogDescription>
                Apporta modifiche ai dettagli del servizio a canone.
              </DialogDescription>
            </DialogHeader>
            <CanoneEditDialog // Use CanoneEditDialog here
              canone={selectedCanoneForEdit}
              onSave={handleSaveEdit} // Pass onSave prop
              onClose={handleCloseDialog} // Pass onClose prop
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}