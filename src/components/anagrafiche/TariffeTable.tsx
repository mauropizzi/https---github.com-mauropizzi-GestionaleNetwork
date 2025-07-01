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
import { Edit, Trash2, RefreshCcw } from "lucide-react";
import { showInfo, showError, showSuccess } from "@/utils/toast";
import { supabase } from "@/integrations/supabase/client";
import { Cliente, PuntoServizio, Fornitore } from "@/lib/anagrafiche-data";
import { fetchClienti, fetchPuntiServizio, fetchFornitori } from "@/lib/data-fetching";
import { TariffaEditDialog } from "./TariffaEditDialog"; // Import the new dialog

interface Tariffa {
  id: string;
  created_at: string;
  client_id: string;
  service_type: string;
  client_rate: number;
  supplier_rate: number;
  unita_misura: string;
  punto_servizio_id?: string | null;
  fornitore_id?: string | null;
  data_inizio_validita?: string | null;
  data_fine_validita?: string | null;
  note?: string | null;
  // Joined fields
  nome_cliente?: string;
  nome_punto_servizio?: string;
  nome_fornitore?: string;
}

export function TariffeTable() {
  const [data, setData] = useState<Tariffa[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTariffaForEdit, setSelectedTariffaForEdit] = useState<Tariffa | null>(null);

  const fetchTariffeData = useCallback(async () => {
    setLoading(true);
    const { data: tariffeData, error: tariffeError } = await supabase
      .from('tariffe')
      .select('*, clienti(nome_cliente), punti_servizio(nome_punto_servizio), fornitori(nome_fornitore)');

    if (tariffeError) {
      showError(`Errore nel recupero delle tariffe: ${tariffeError.message}`);
      console.error("Error fetching tariffe:", tariffeError);
      setData([]);
    } else {
      const mappedData = tariffeData.map(t => ({
        ...t,
        nome_cliente: t.clienti?.nome_cliente || 'N/A',
        nome_punto_servizio: t.punti_servizio?.nome_punto_servizio || 'N/A',
        nome_fornitore: t.fornitori?.nome_fornitore || 'N/A',
      }));
      setData(mappedData || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTariffeData();
  }, [fetchTariffeData]);

  const handleEdit = useCallback((tariffa: Tariffa) => {
    setSelectedTariffaForEdit(tariffa);
    setIsEditDialogOpen(true);
  }, []);

  const handleSaveEdit = useCallback((updatedTariffa: Tariffa) => {
    // Update local state to reflect changes immediately
    setData(prevData =>
      prevData.map(t =>
        t.id === updatedTariffa.id ? updatedTariffa : t
      )
    );
    fetchTariffeData(); // Re-fetch to ensure data consistency
    setIsEditDialogOpen(false);
    setSelectedTariffaForEdit(null);
  }, [fetchTariffeData]);

  const handleCloseDialog = useCallback(() => {
    setIsEditDialogOpen(false);
    setSelectedTariffaForEdit(null);
  }, []);

  const handleDelete = async (tariffaId: string, serviceType: string) => {
    if (window.confirm(`Sei sicuro di voler eliminare la tariffa "${serviceType}"?`)) {
      const { error } = await supabase
        .from('tariffe')
        .delete()
        .eq('id', tariffaId);

      if (error) {
        showError(`Errore durante l'eliminazione della tariffa: ${error.message}`);
        console.error("Error deleting tariffa:", error);
      } else {
        showSuccess(`Tariffa "${serviceType}" eliminata con successo!`);
        fetchTariffeData(); // Refresh data after deletion
      }
    } else {
      showInfo(`Eliminazione della tariffa "${serviceType}" annullata.`);
    }
  };

  const filteredData = useMemo(() => {
    return data.filter(tariffa => {
      const searchLower = searchTerm.toLowerCase();
      return (
        tariffa.service_type.toLowerCase().includes(searchLower) ||
        (tariffa.nome_cliente?.toLowerCase().includes(searchLower)) ||
        (tariffa.nome_punto_servizio?.toLowerCase().includes(searchLower)) ||
        (tariffa.nome_fornitore?.toLowerCase().includes(searchLower)) ||
        tariffa.unita_misura.toLowerCase().includes(searchLower)
      );
    });
  }, [data, searchTerm]);

  const columns: ColumnDef<Tariffa>[] = useMemo(() => [
    {
      accessorKey: "nome_cliente",
      header: "Cliente",
      cell: ({ row }) => <span>{row.original.nome_cliente}</span>,
    },
    {
      accessorKey: "service_type",
      header: "Tipo Servizio",
      cell: ({ row }) => <span>{row.original.service_type}</span>,
    },
    {
      accessorKey: "client_rate",
      header: "Tariffa Cliente (€)",
      cell: ({ row }) => <span>{`${row.original.client_rate.toFixed(2)} €`}</span>,
    },
    {
      accessorKey: "supplier_rate",
      header: "Tariffa Fornitore (€)",
      cell: ({ row }) => <span>{`${row.original.supplier_rate.toFixed(2)} €`}</span>,
    },
    {
      accessorKey: "unita_misura",
      header: "Unità Misura",
      cell: ({ row }) => <span>{row.original.unita_misura}</span>,
    },
    {
      accessorKey: "nome_punto_servizio",
      header: "Punto Servizio",
      cell: ({ row }) => <span>{row.original.nome_punto_servizio}</span>,
    },
    {
      accessorKey: "nome_fornitore",
      header: "Fornitore",
      cell: ({ row }) => <span>{row.original.nome_fornitore}</span>,
    },
    {
      accessorKey: "data_inizio_validita",
      header: "Inizio Validità",
      cell: ({ row }) => <span>{row.original.data_inizio_validita ? format(new Date(row.original.data_inizio_validita), "PPP", { locale: it }) : "N/A"}</span>,
    },
    {
      accessorKey: "data_fine_validita",
      header: "Fine Validità",
      cell: ({ row }) => <span>{row.original.data_fine_validita ? format(new Date(row.original.data_fine_validita), "PPP", { locale: it }) : "N/A"}</span>,
    },
    {
      id: "actions",
      header: "Azioni",
      cell: ({ row }) => (
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={() => handleEdit(row.original)} title="Modifica">
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="destructive" size="sm" onClick={() => handleDelete(row.original.id, row.original.service_type)} title="Elimina">
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
          placeholder="Cerca per tipo servizio, cliente, fornitore..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Button variant="outline" onClick={fetchTariffeData} disabled={loading}>
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
                  Caricamento tariffe...
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
                  Nessuna tariffa trovata.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {selectedTariffaForEdit && (
        <TariffaEditDialog
          isOpen={isEditDialogOpen}
          onClose={handleCloseDialog}
          tariffa={selectedTariffaForEdit}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
}