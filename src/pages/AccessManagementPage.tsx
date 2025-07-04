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
import { RefreshCcw } from "lucide-react";
import { showInfo, showError, showSuccess } from "@/utils/toast";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'user' | 'admin';
}

const AccessManagementPage = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke('get-users-with-profiles');

    if (error) {
      showError(`Errore nel recupero degli utenti: ${error.message}`);
      console.error("Error fetching users with profiles:", error);
      setUsers([]);
    } else {
      setUsers(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRoleChange = async (userId: string, newRole: 'user' | 'admin') => {
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
      // Update local state for immediate feedback
      setUsers(currentUsers => 
        currentUsers.map(user => 
          user.id === userId ? { ...user, role: newRole } : user
        )
      );
    }
  };

  const filteredData = useMemo(() => {
    return users.filter(user => {
      const searchLower = searchTerm.toLowerCase();
      return (
        (user.email || '').toLowerCase().includes(searchLower) ||
        (user.first_name || '').toLowerCase().includes(searchLower) ||
        (user.last_name || '').toLowerCase().includes(searchLower) ||
        (user.role || '').toLowerCase().includes(searchLower)
      );
    });
  }, [users, searchTerm]);

  const columns: ColumnDef<UserProfile>[] = useMemo(() => [
    {
      accessorKey: "first_name",
      header: "Nome",
      cell: ({ row }) => <span>{row.original.first_name || 'N/A'}</span>,
    },
    {
      accessorKey: "last_name",
      header: "Cognome",
      cell: ({ row }) => <span>{row.original.last_name || 'N/A'}</span>,
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => <span>{row.original.email}</span>,
    },
    {
      accessorKey: "role",
      header: "Ruolo",
      cell: ({ row }) => (
        <Select
          value={row.original.role}
          onValueChange={(value: 'user' | 'admin') => handleRoleChange(row.original.id, value)}
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Seleziona ruolo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="user">User</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
      ),
    },
  ], []);

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="container mx-auto p-4">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">Gestione Livelli di Accesso</CardTitle>
          <CardDescription className="text-center">Visualizza e modifica i ruoli degli utenti del sistema.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 items-center mb-4">
            <Input
              placeholder="Cerca per nome, email, ruolo..."
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
        </CardContent>
      </Card>
    </div>
  );
};

export default AccessManagementPage;