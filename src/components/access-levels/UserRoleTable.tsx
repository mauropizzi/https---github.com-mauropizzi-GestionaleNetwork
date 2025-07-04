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
import { RefreshCcw, Edit } from "lucide-react";
import { showInfo, showError, showSuccess } from "@/utils/toast";
import { supabase } from "@/integrations/supabase/client";
import { UserProfile } from "@/lib/anagrafiche-data";
import { UserRoleEditDialog } from "./UserRoleEditDialog";

export function UserRoleTable() {
  const [data, setData] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<UserProfile | null>(null);

  const fetchUsersWithRoles = useCallback(async () => {
    setLoading(true);
    // Fetch users from auth.users and join with public.profiles
    const { data: usersData, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, role, auth_users:auth.users(email)'); // Join with auth.users to get email

    if (error) {
      showError(`Errore nel recupero degli utenti: ${error.message}`);
      console.error("Error fetching users with roles:", error);
      setData([]);
    } else {
      const mappedData: UserProfile[] = usersData.map((profile: any) => ({
        id: profile.id,
        first_name: profile.first_name,
        last_name: profile.last_name,
        role: profile.role,
        email: profile.auth_users?.email || 'N/A', // Extract email from joined data
      }));
      setData(mappedData || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUsersWithRoles();
  }, [fetchUsersWithRoles]);

  const handleEdit = useCallback((user: UserProfile) => {
    setSelectedUserForEdit(user);
    setIsEditDialogOpen(true);
  }, []);

  const handleSaveEdit = useCallback((updatedUser: UserProfile) => {
    // Update local state to reflect changes immediately
    setData(prevData =>
      prevData.map(u =>
        u.id === updatedUser.id ? updatedUser : u
      )
    );
    // Optionally, refetch all data to ensure consistency with backend
    // fetchUsersWithRoles(); // Uncomment if you prefer a full re-fetch
    setIsEditDialogOpen(false);
    setSelectedUserForEdit(null);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setIsEditDialogOpen(false);
    setSelectedUserForEdit(null);
  }, []);

  const filteredData = useMemo(() => {
    return data.filter(user => {
      const searchLower = searchTerm.toLowerCase();
      return (
        (user.first_name?.toLowerCase().includes(searchLower)) ||
        (user.last_name?.toLowerCase().includes(searchLower)) ||
        (user.email?.toLowerCase().includes(searchLower)) ||
        (user.role?.toLowerCase().includes(searchLower))
      );
    });
  }, [data, searchTerm]);

  const columns: ColumnDef<UserProfile>[] = useMemo(() => [
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => <span>{row.original.email}</span>,
    },
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
      accessorKey: "role",
      header: "Ruolo",
      cell: ({ row }) => <span>{row.original.role || 'N/A'}</span>,
    },
    {
      id: "actions",
      header: "Azioni",
      cell: ({ row }) => (
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={() => handleEdit(row.original)} title="Modifica Ruolo">
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ], [handleEdit]);

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <Input
          placeholder="Cerca per nome, email, ruolo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Button variant="outline" onClick={fetchUsersWithRoles} disabled={loading}>
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
        <UserRoleEditDialog
          isOpen={isEditDialogOpen}
          onClose={handleCloseDialog}
          user={selectedUserForEdit}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
}