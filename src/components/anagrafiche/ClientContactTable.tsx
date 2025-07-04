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
import { ClientContact } from "@/lib/anagrafiche-data";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ClientContactForm } from "./ClientContactForm";

interface ClientContactTableProps {
  clientId: string;
}

export function ClientContactTable({ clientId }: ClientContactTableProps) {
  const [data, setData] = useState<ClientContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedContactForEdit, setSelectedContactForEdit] = useState<ClientContact | null>(null);

  const fetchClientContacts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('client_contacts')
      .select('*')
      .eq('client_id', clientId)
      .order('department', { ascending: true })
      .order('contact_name', { ascending: true });

    if (error) {
      showError(`Errore nel recupero dei contatti: ${error.message}`);
      console.error("Error fetching client contacts:", error);
      setData([]);
    } else {
      setData(data || []);
    }
    setLoading(false);
  }, [clientId]);

  useEffect(() => {
    if (clientId) {
      fetchClientContacts();
    }
  }, [clientId, fetchClientContacts]);

  const handleEdit = useCallback((contact: ClientContact) => {
    setSelectedContactForEdit(contact);
    setIsEditDialogOpen(true);
  }, []);

  const handleSaveEdit = useCallback(() => {
    fetchClientContacts(); // Refresh data after save
    setIsEditDialogOpen(false);
    setSelectedContactForEdit(null);
  }, [fetchClientContacts]);

  const handleCloseDialog = useCallback(() => {
    setIsEditDialogOpen(false);
    setSelectedContactForEdit(null);
  }, []);

  const handleDelete = async (contactId: string, contactName: string) => {
    if (window.confirm(`Sei sicuro di voler eliminare il contatto "${contactName}"?`)) {
      const { error } = await supabase
        .from('client_contacts')
        .delete()
        .eq('id', contactId);

      if (error) {
        showError(`Errore durante l'eliminazione del contatto: ${error.message}`);
        console.error("Error deleting client contact:", error);
      } else {
        showSuccess(`Contatto "${contactName}" eliminato con successo!`);
        fetchClientContacts(); // Refresh data after deletion
      }
    } else {
      showInfo(`Eliminazione del contatto "${contactName}" annullata.`);
    }
  };

  const filteredData = useMemo(() => {
    return data.filter(contact => {
      const searchLower = searchTerm.toLowerCase();
      return (
        contact.department.toLowerCase().includes(searchLower) ||
        (contact.contact_name?.toLowerCase().includes(searchLower)) ||
        (contact.email?.toLowerCase().includes(searchLower)) ||
        (contact.phone?.toLowerCase().includes(searchLower))
      );
    });
  }, [data, searchTerm]);

  const columns: ColumnDef<ClientContact>[] = useMemo(() => [
    {
      accessorKey: "department",
      header: "Dipartimento",
      cell: ({ row }) => <span>{row.original.department}</span>,
    },
    {
      accessorKey: "contact_name",
      header: "Nome Contatto",
      cell: ({ row }) => <span>{row.original.contact_name || 'N/A'}</span>,
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => <span>{row.original.email || 'N/A'}</span>,
    },
    {
      accessorKey: "phone",
      header: "Telefono",
      cell: ({ row }) => <span>{row.original.phone || 'N/A'}</span>,
    },
    {
      accessorKey: "notes",
      header: "Note",
      cell: ({ row }) => <span className="line-clamp-2">{row.original.notes || 'N/A'}</span>,
    },
    {
      id: "actions",
      header: "Azioni",
      cell: ({ row }) => (
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={() => handleEdit(row.original)} title="Modifica">
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="destructive" size="sm" onClick={() => handleDelete(row.original.id!, row.original.contact_name || row.original.department)} title="Elimina">
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
          placeholder="Cerca per dipartimento, nome, email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Button variant="outline" onClick={fetchClientContacts} disabled={loading}>
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
              </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Caricamento contatti...
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
                  Nessun contatto trovato per questo cliente.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {selectedContactForEdit && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Modifica Contatto</DialogTitle>
              <DialogDescription>
                Apporta modifiche ai dettagli del contatto.
              </DialogDescription>
            </DialogHeader>
            <ClientContactForm
              clientId={clientId}
              contact={selectedContactForEdit}
              onSaveSuccess={handleSaveEdit}
              onCancel={handleCloseDialog}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}