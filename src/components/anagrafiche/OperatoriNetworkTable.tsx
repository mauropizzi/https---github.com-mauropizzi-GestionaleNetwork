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

interface OperatoreNetworkExtended extends OperatoreNetwork {
  nome_cliente?: string; // To display the client name
}

export function OperatoriNetworkTable() {
  const [data, setData] = useState<OperatoreNetworkExtended[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchOperatoriNetworkData = useCallback(async () => {
    setLoading(true);
    const { data: operatoriData, error } = await supabase
      .from('operatori_network')
      .select('id, created_at, nome, cognome, telefono, email, clienti(nome_cliente)'); // Select new fields and join clients

    if (error) {
      showError(`Errore nel recupero degli operatori network: ${error.message}`);
      console.error("Error fetching operatori_network:", error);
      setData([]);
    } else {
      const mappedData = operatoriData.map(op => ({
        ...op,
        nome_cliente: op.clienti?.nome_cliente || 'N/A',
      }));
      setData(mappedData || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchOperatoriNetworkData();
  }, [fetchOperatoriNetworkData]);

  const handleEdit = (operatore: OperatoreNetworkExtended) => {
    showInfo(`Modifica operatore network: ${operatore.nome} ${operatore.cognome || ''} (ID: ${operatore.id})`);
    // Qui potresti aprire un dialog di modifica o navigare a una pagina di modifica
  };

  const handleDelete = async (operatoreId: string, nomeOperatore: string) => {
    if (window.confirm(`Sei sicuro di voler eliminare l'operatore network "${nomeOperatore}"?`)) {
      const { error } = await supabase
        .from('operatori_network')
        .delete()
        .eq('id', operatoreId);

      if (error) {
        showError(`Errore durante l'eliminazione dell'operatore network: ${error.message}`);
        console.error("Error deleting operatore_network:", error);
      } else {
        showSuccess(`Operatore network "${nomeOperatore}" eliminato con successo!`);
        fetchOperatoriNetworkData(); // Refresh data after deletion
      }
    } else {
      showInfo(`Eliminazione dell'operatore network "${nomeOperatore}" annullata.`);
    }
  };

  const filteredData = useMemo(() => {
    return data.filter(operatore => {
      const searchLower = searchTerm.toLowerCase();
      return (
        operatore.nome.toLowerCase().includes(searchLower) ||
        (operatore.cognome?.toLowerCase().includes(searchLower)) ||
        (operatore.nome_cliente?.toLowerCase().includes(searchLower)) ||
        (operatore.telefono?.toLowerCase().includes(searchLower)) ||
        (operatore.email?.toLowerCase().includes(searchLower))
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
      cell: ({ row }) => <span>{row.original.cognome || 'N/A'}</span>,
    },
    {
      accessorKey: "nome_cliente",
      header: "Cliente Associato",
      cell: ({ row }) => <span>{row.original.nome_cliente}</span>,
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
      id: "actions",
      header: "Azioni",
      cell: ({ row }) => (
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={() => handleEdit(row.original)} title="Modifica">
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="destructive" size="sm" onClick={() => handleDelete(row.original.id, `${row.original.nome} ${row.original.cognome || ''}`)} title="Elimina">
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
          placeholder="Cerca per nome, cognome, cliente, email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Button variant="outline" onClick={fetchOperatoriNetworkData} disabled={loading}>
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
                  Caricamento operatori network...
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
                  Nessun operatore network trovato.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}