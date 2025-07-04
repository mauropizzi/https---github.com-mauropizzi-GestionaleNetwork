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
import { OperatoreNetwork } from "@/lib/anagrafiche-data";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { OperatoreNetworkForm } from "./OperatoreNetworkForm";

// Extend OperatoreNetwork to include joined client data
interface OperatoreNetworkExtended extends OperatoreNetwork {
  clienti: { nome_cliente: string }[];
}

export function OperatoriNetworkTable() {
  const [data, setData] = useState<OperatoreNetworkExtended[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedOperatoreForEdit, setSelectedOperatoreForEdit] = useState<OperatoreNetwork | null>(null);

  const fetchOperatoriNetwork = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('operatori_network')
      .select('*, clienti(nome_cliente)') // Select all from operatori_network and nome_cliente from related clienti
      .order('nome', { ascending: true });

    if (error) {
      showError(`Errore nel recupero degli operatori: ${error.message}`);
      console.error("Error fetching operatori network:", error);
      setData([]);
    } else {
      // Map the data to ensure 'clienti' is always an array, even if empty or single
      const mappedData: OperatoreNetworkExtended[] = data.map(op => ({
        ...op,
        clienti: op.clienti || [], // Ensure it's an array
      }));
      setData(mappedData);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchOperatoriNetwork();
  }, [fetchOperatoriNetwork]);

  const handleEdit = useCallback((operatore: OperatoreNetwork) => {
    setSelectedOperatoreForEdit(operatore);
    setIsEditDialogOpen(true);
  }, []);

  const handleSaveEdit = useCallback(() => {
    fetchOperatoriNetwork(); // Refresh data after save
    setIsEditDialogOpen(false);
    setSelectedOperatoreForEdit(null);
  }, [fetchOperatoriNetwork]);

  const handleCloseDialog = useCallback(() => {
    setIsEditDialogOpen(false);
    setSelectedOperatoreForEdit(null);
  }, []);

  const handleDelete = async (operatoreId: string, operatoreName: string) => {
    if (window.confirm(`Sei sicuro di voler eliminare l'operatore "${operatoreName}"?`)) {
      const { error } = await supabase
        .from('operatori_network')
        .delete()
        .eq('id', operatoreId);

      if (error) {
        showError(`Errore durante l'eliminazione dell'operatore: ${error.message}`);
        console.error("Error deleting operatore network:", error);
      } else {
        showSuccess(`Operatore "${operatoreName}" eliminato con successo!`);
        fetchOperatoriNetwork(); // Refresh data after deletion
      }
    } else {
      showInfo(`Eliminazione dell'operatore "${operatoreName}" annullata.`);
    }
  };

  const filteredData = useMemo(() => {
    return data.filter(operatore => {
      const searchLower = searchTerm.toLowerCase();
      return (
        operatore.nome.toLowerCase().includes(searchLower) ||
        operatore.cognome.toLowerCase().includes(searchLower) ||
        (operatore.email?.toLowerCase().includes(searchLower)) ||
        (operatore.telefono?.toLowerCase().includes(searchLower)) ||
        (operatore.clienti && operatore.clienti[0]?.nome_cliente?.toLowerCase().includes(searchLower)) // Access nome_cliente from the first element of the array
      );
    });
  }, [data, searchTerm]);

  const columns: ColumnDef<OperatoreNetworkExtended>[] = useMemo(() => [
    {
      accessorKey: "nome",
      header: "Nome",
      cell: ({ row }) => <span>{row.original.nome}</span>,
    },
    {
      accessorKey: "cognome",
      header: "Cognome",
      cell: ({ row }) => <span>{row.original.cognome}</span>,
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
      accessorKey: "client_id",
      header: "Cliente Associato",
      cell: ({ row }) => <span>{row.original.clienti[0]?.nome_cliente || 'N/A'}</span>, // Access nome_cliente from the first element of the array
    },
    {
      id: "actions",
      header: "Azioni",
      cell: ({ row }) => (
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={() => handleEdit(row.original)} title="Modifica">
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="destructive" size="sm" onClick={() => handleDelete(row.original.id!, `${row.original.nome} ${row.original.cognome}`)} title="Elimina">
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
          placeholder="Cerca per nome, cognome, email, cliente..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Button variant="outline" onClick={fetchOperatoriNetwork} disabled={loading}>
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
                  Caricamento operatori...
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
                  Nessun operatore trovato.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {selectedOperatoreForEdit && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Modifica Operatore</DialogTitle>
              <DialogDescription>
                Apporta modifiche ai dettagli dell'operatore.
              </DialogDescription>
            </DialogHeader>
            <OperatoreNetworkForm
              operatore={selectedOperatoreForEdit}
              onSaveSuccess={handleSaveEdit}
              onCancel={handleCloseDialog}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}