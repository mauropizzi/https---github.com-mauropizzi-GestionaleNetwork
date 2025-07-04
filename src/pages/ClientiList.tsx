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
import { Edit, Trash2, RefreshCcw, PlusCircle, Upload } from "lucide-react";
import { showInfo, showError, showSuccess } from "@/utils/toast";
import { supabase } from "@/integrations/supabase/client";
import { Cliente } from "@/lib/anagrafiche-data";
import { ClienteEditDialog } from "@/components/anagrafiche/ClientiEditDialog";
import { importDataFromExcel } from "@/utils/import"; // Assuming this utility exists

// Define a type for the import result that includes duplicateRecords
interface ImportResult {
  newRecordsCount: number;
  updatedRecordsCount: number;
  invalidRecords: any[];
  duplicateRecords?: any[]; // Added duplicateRecords
  errors?: string[];
}

export default function ClientiList() {
  const [data, setData] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedClienteForEdit, setSelectedClienteForEdit] = useState<Cliente | null>(null);

  const fetchClienti = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('clienti')
      .select('*')
      .order('nome_cliente', { ascending: true });

    if (error) {
      showError(`Errore nel recupero dei clienti: ${error.message}`);
      console.error("Error fetching clienti:", error);
      setData([]);
    } else {
      setData(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchClienti();
  }, [fetchClienti]);

  const handleAddCliente = useCallback(() => {
    setSelectedClienteForEdit(null);
    setIsEditDialogOpen(true);
  }, []);

  const handleEdit = useCallback((cliente: Cliente) => {
    setSelectedClienteForEdit(cliente);
    setIsEditDialogOpen(true);
  }, []);

  const handleSaveEdit = useCallback(() => {
    fetchClienti(); // Refresh data after save
    setIsEditDialogOpen(false);
    setSelectedClienteForEdit(null);
  }, [fetchClienti]);

  const handleCloseDialog = useCallback(() => {
    setIsEditDialogOpen(false);
    setSelectedClienteForEdit(null);
  }, []);

  const handleDelete = async (clienteId: string, clienteName: string) => {
    if (window.confirm(`Sei sicuro di voler eliminare il cliente "${clienteName}"?`)) {
      const { error } = await supabase
        .from('clienti')
        .delete()
        .eq('id', clienteId);

      if (error) {
        showError(`Errore durante l'eliminazione del cliente: ${error.message}`);
        console.error("Error deleting cliente:", error);
      } else {
        showSuccess(`Cliente "${clienteName}" eliminato con successo!`);
        fetchClienti(); // Refresh data after deletion
      }
    } else {
      showInfo(`Eliminazione del cliente "${clienteName}" annullata.`);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      showInfo("Nessun file selezionato.");
      return;
    }

    setLoading(true);
    try {
      const result: ImportResult = await importDataFromExcel(file, 'clienti');
      showSuccess(`Importazione completata: ${result.newRecordsCount} nuovi, ${result.updatedRecordsCount} aggiornati.`);
      if (result.invalidRecords.length > 0) {
        showError(`Record non validi: ${result.invalidRecords.length}. Controlla la console per i dettagli.`);
        console.error("Record non validi:", result.invalidRecords);
      }
      if (result.duplicateRecords && result.duplicateRecords.length > 0) {
        showInfo(`Record duplicati ignorati: ${result.duplicateRecords.length}. Controlla la console per i dettagli.`);
        console.info("Record duplicati:", result.duplicateRecords);
      }
      if (result.errors && result.errors.length > 0) {
        result.errors.forEach(err => showError(err));
        console.error("Errori durante l'importazione:", result.errors);
      }
      fetchClienti();
    } catch (error: any) {
      showError(`Errore durante l'importazione: ${error.message}`);
      console.error("Import error:", error);
    } finally {
      setLoading(false);
      event.target.value = ''; // Clear the input so the same file can be selected again
    }
  };

  const filteredData = useMemo(() => {
    return data.filter(cliente => {
      const searchLower = searchTerm.toLowerCase();
      return (
        cliente.nome_cliente.toLowerCase().includes(searchLower) ||
        (cliente.email?.toLowerCase().includes(searchLower)) ||
        (cliente.telefono?.toLowerCase().includes(searchLower)) ||
        (cliente.indirizzo?.toLowerCase().includes(searchLower)) ||
        (cliente.citta?.toLowerCase().includes(searchLower))
      );
    });
  }, [data, searchTerm]);

  const columns: ColumnDef<Cliente>[] = useMemo(() => [
    {
      accessorKey: "nome_cliente",
      header: "Nome Cliente",
      cell: ({ row }) => <span>{row.original.nome_cliente}</span>,
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => <span>{row.original.email || 'N/A'}</span>,
    },
    {
      accessorKey: "telefono",
      header: "Telefono",
      cell: ({ row }) => <span>{row.original.telefono || 'N/A'}</span>,
    },
    {
      accessorKey: "indirizzo",
      header: "Indirizzo",
      cell: ({ row }) => <span>{row.original.indirizzo || 'N/A'}</span>,
    },
    {
      accessorKey: "citta",
      header: "Città",
      cell: ({ row }) => <span>{row.original.citta || 'N/A'}</span>,
    },
    {
      id: "actions",
      header: "Azioni",
      cell: ({ row }) => (
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={() => handleEdit(row.original)} title="Modifica">
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="destructive" size="sm" onClick={() => handleDelete(row.original.id!, row.original.nome_cliente)} title="Elimina">
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
          placeholder="Cerca per nome, email, telefono, indirizzo, città..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Button variant="outline" onClick={fetchClienti} disabled={loading}>
          <RefreshCcw className="mr-2 h-4 w-4" /> {loading ? 'Caricamento...' : 'Aggiorna Dati'}
        </Button>
        <Button onClick={handleAddCliente}>
          <PlusCircle className="mr-2 h-4 w-4" /> Aggiungi Cliente
        </Button>
        <label htmlFor="import-excel" className="cursor-pointer">
          <Button asChild variant="outline">
            <div>
              <Upload className="mr-2 h-4 w-4" /> Importa Excel
              <Input
                id="import-excel"
                type="file"
                accept=".xlsx, .xls"
                onChange={handleImport}
                className="sr-only"
                disabled={loading}
              />
            </div>
          </Button>
        </label>
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
                  Caricamento clienti...
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
                  Nessun cliente trovato.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <ClienteEditDialog
        isOpen={isEditDialogOpen}
        onClose={handleCloseDialog}
        cliente={selectedClienteForEdit}
        onSaveSuccess={handleSaveEdit}
      />
    </div>
  );
}