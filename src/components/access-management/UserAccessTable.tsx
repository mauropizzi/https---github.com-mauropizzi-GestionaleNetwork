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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCcw, Edit, Trash2 } from "lucide-react";
import { showInfo, showError, showSuccess } from "@/utils/toast";
import { supabase } from "@/integrations/supabase/client";
import { UserProfile } from "@/lib/anagrafiche-data";
import { UserEditDialog } from "./UserEditDialog";

export function UserAccessTable() {
  const [data, setData] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<UserProfile | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke('get-users-with-profiles');

    if (error) {
      showError(`Errore nel recupero degli utenti: ${error.message}`);
      console.error("Error fetching users with profiles:", error);
      setData([]);
    } else {
      setData(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRoleChange = async (userId: string, newRole: UserProfile['role']) => {
    showInfo(`Aggiornamento ruolo per l'utente...`);
    
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId);

    if (error) {
      showError(`Errore durante l'aggiornamento del ruolo: ${error.message}`);
      console.error("Error updating user role:", error);
    } else {
      showSuccess("Ruolo aggiornato con successo!");
      setData(prevData =>
        prevData.map(user =>
          user.id === userId ? { ...user, role: newRole } : user
        )
      );
    }
  };

  const handleEdit = useCallback((user: UserProfile) => {
    setSelectedUserForEdit(user);
    setIsEditDialogOpen(true);
  }, []);

  const handleSaveEdit = useCallback((updatedUser: UserProfile) => {
    setData(prevData =>
      prevData.map(u =>
        u.id === updatedUser.id ? updatedUser : u
      )
    );
    setIsEditDialogOpen(false);
    setSelectedUserForEdit(null);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setIsEditDialogOpen(false);
    setSelectedUserForEdit(null);
  }, []);

  const handleDelete = async (userId: string, userEmail: string) => {
    if (window.confirm(`Sei sicuro di voler eliminare l'utente "${userEmail}"? Questa azione è irreversibile e rimuoverà l'utente dal sistema di autenticazione.`)) {
      showInfo(`Eliminazione utente "${userEmail}" in corso...`);
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { userId },
      });

      if (error) {
        showError(`Errore durante l'eliminazione dell'utente: ${error.message}`);
        console.error("Error deleting user via Edge Function:", error);
      } else {
        showSuccess(`Utente "${userEmail}" eliminato con successo!`);
        fetchUsers();
      }
    } else {
      showInfo(`Eliminazione dell'utente "${userEmail}" annullata.`);
    }
  };

  const filteredData = useMemo(() => {
    return data.filter(user => {
      const searchLower = searchTerm.toLowerCase();
      return (
        user.email.toLowerCase().includes(searchLower) ||
        user.first_name.toLowerCase().includes(searchLower) ||
        user.last_name.toLowerCase().includes(searchLower) ||
        user.role.toLowerCase().includes(searchLower)
      );
    });
  }, [data, searchTerm]);

  const columns: ColumnDef<UserProfile>[] = useMemo(() => [
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "first_name",
      header: "Nome",
    },
    {
      accessorKey: "last_name",
      header: "Cognome",
    },
    {
      accessorKey: "role",
      header: "Ruolo",
      cell: ({ row }) => (
        <Select
          value={row.original.role}
          onValueChange={(value: UserProfile['role']) => handleRoleChange(row.original.id, value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Seleziona ruolo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Amministratore">Amministratore</SelectItem>
            <SelectItem value="Amministrazione">Amministrazione</SelectItem>
            <SelectItem value="Centrale Operativa">Centrale Operativa</SelectItem>
            <SelectItem value="Personale esterno">Personale esterno</SelectItem>
          </SelectContent>
        </Select>
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
          <Button variant="destructive" size="sm" onClick={() => handleDelete(row.original.id, row.original.email)} title="Elimina">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ], [handleRoleChange, handleEdit, handleDelete]);

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <Input
          placeholder="Cerca per email, nome, cognome..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Button variant="outline" onClick={fetchUsers} disabled={loading}>
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
                  Caricamento utenti...
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
                  Nessun utente trovato.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {selectedUserForEdit && (
        <UserEditDialog
          isOpen={isEditDialogOpen}
          onClose={handleCloseDialog}
          user={selectedUserForEdit}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
}