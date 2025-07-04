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
import { Edit, Trash2, RefreshCcw, AddressBook } from "lucide-react"; // Import AddressBook icon
import { showInfo, showError, showSuccess } from "@/utils/toast";
import { supabase } from "@/integrations/supabase/client";
import { Cliente } from "@/lib/anagrafiche-data";
import { ClientiEditDialog } from "./ClientiEditDialog"; // Import the new dialog
import { useNavigate } from "react-router-dom"; // Import useNavigate

export function ClientiTable() {
  const navigate = useNavigate(); // Initialize useNavigate
  const [data, setData] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedClienteForEdit, setSelectedClienteForEdit] = useState<Cliente | null>(null);

  const fetchClientiData = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('clienti')
      .select('id, created_at, nome_cliente, codice_fiscale, partita_iva, indirizzo, citta, cap, provincia, telefono, email, pec, sdi, attivo, note');

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
    fetchClientiData();
  }, [fetchClientiData]);

  const handleEdit = useCallback((cliente: Cliente) => {
    setSelectedClienteForEdit(cliente);
    setIsEditDialogOpen(true);
  }, []);

  const handleSaveEdit = useCallback((updatedCliente: Cliente) => {
    // Update local state to reflect changes immediately
    setData(prevData =>
      prevData.map(c =>
        c.id === updatedCliente.id ? updatedCliente : c
      )
    );
    // Optionally, refetch all data to ensure consistency with backend
    fetchClientiData(); // Uncomment if you prefer a full re-fetch
    setIsEditDialogOpen(false);
    setSelectedClienteForEdit(null);
  }, [fetchClientiData]);

  const handleCloseDialog = useCallback(() => {
    setIsEditDialogOpen(false);
    setSelectedClienteForEdit(null);
  }, []);

  const handleDelete = async (clienteId: string, nomeCliente: string) => {
    if (window.confirm(`Sei sicuro di voler eliminare il cliente "${nomeCliente}"?`)) {
      const { error } = await supabase
        .from('clienti')
        .delete()
        .eq('id', clienteId);

      if (error) {
        showError(`Errore durante l'eliminazione del cliente: ${error.message}`);
        console.error("Error deleting cliente:", error);
      } else {
        showSuccess(`Cliente "${nomeCliente}" eliminato con successo!`);
        fetchClientiData(); // Refresh data after deletion
      }
    } else {
      showInfo(`Eliminazione del cliente "${nomeCliente}" annullata.`);
    }
  };

  const handleViewContacts = useCallback((clienteId: string) => {
    navigate(`/anagrafiche/clienti/${clienteId}/contacts`);
  }, [navigate]);

  const filteredData = useMemo(() => {
    return data.filter(cliente => {
      const searchLower = searchTerm.toLowerCase();
      return (
        cliente.nome_cliente.toLowerCase().includes(searchLower) ||
        (cliente.codice_fiscale?.toLowerCase().includes(searchLower)) ||
        (cliente.partita_iva?.toLowerCase().includes(searchLower)) ||
        (cliente.citta?.toLowerCase().includes(searchLower)) ||
        (cliente.email?.toLowerCase().includes(searchLower))
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
      accessorKey: "codice_fiscale",
      header: "Codice Fiscale",
      cell: ({ row }) => <span>{row.original.codice_fiscale || 'N/A'}</span>,
    },
    {
      accessorKey: "partita_iva",
      header: "Partita IVA",
      cell: ({ row }) => <span>{row.original.partita_iva || 'N/A'}</span>,
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
      accessorKey: "attivo",
      header: "Attivo",
      cell: ({ row }) => <span>{row.original.attivo ? "Sì" : "No"}</span>,
    },
    {
      id: "actions",
      header: "Azioni",
      cell: ({ row }) => (
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={() => handleEdit(row.original)} title="Modifica Cliente">
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleViewContacts(row.original.id)} title="Visualizza Contatti">
            <AddressBook className="h-4 w-4" />
          </Button>
          <Button variant="destructive" size="sm" onClick={() => handleDelete(row.original.id, row.original.nome_cliente)} title="Elimina Cliente">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ], [handleEdit, handleDelete, handleViewContacts]);

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <Input
          placeholder="Cerca per nome, codice fiscale, città..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Button variant="outline" onClick={fetchClientiData} disabled={loading}>
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

      {selectedClienteForEdit && (
        <ClientiEditDialog
          isOpen={isEditDialogOpen}
          onClose={handleCloseDialog}
          cliente={selectedClienteForEdit}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
}