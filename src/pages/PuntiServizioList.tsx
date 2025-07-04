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
import { Edit, Trash2, RefreshCcw, PlusCircle, Upload, Eye } from "lucide-react";
import { showInfo, showError, showSuccess } from "@/utils/toast";
import { supabase } from "@/integrations/supabase/client";
import { PuntoServizio } from "@/lib/anagrafiche-data";
import { PuntoServizioEditDialog } from "@/components/anagrafiche/PuntiServizioEditDialog";
import { PuntoServizioDetailsDialog } from "@/components/anagrafiche/PuntiServizioDetailsDialog";
import { importDataFromExcel } from "@/utils/import"; // Assuming this utility exists

// Define a type for the import result that includes duplicateRecords
interface ImportResult {
  newRecordsCount: number;
  updatedRecordsCount: number;
  invalidRecords: any[];
  duplicateRecords?: any[]; // Added duplicateRecords
  errors?: string[];
}

// Extend PuntoServizio to include joined data for display
interface PuntoServizioExtended extends PuntoServizio {
  fornitori?: { nome_fornitore: string }[] | null; // Changed to array
  clienti?: { nome_cliente: string }[] | null; // Changed to array
  procedure?: { nome_procedura: string }[] | null; // Changed to array
}

export default function PuntiServizioList() {
  const [data, setData] = useState<PuntoServizioExtended[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedPuntoServizioForEdit, setSelectedPuntoServizioForEdit] = useState<PuntoServizio | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedPuntoServizioForDetails, setSelectedPuntoServizioForDetails] = useState<PuntoServizioExtended | null>(null);

  const fetchPuntiServizio = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('punti_servizio')
      .select('*, fornitori(nome_fornitore), clienti(nome_cliente), procedure(nome_procedura)')
      .order('nome_punto_servizio', { ascending: true });

    if (error) {
      showError(`Errore nel recupero dei punti di servizio: ${error.message}`);
      console.error("Error fetching punti servizio:", error);
      setData([]);
    } else {
      const mappedData: PuntoServizioExtended[] = data.map(ps => ({
        ...ps,
        fornitori: ps.fornitori || null,
        clienti: ps.clienti || null,
        procedure: ps.procedure || null,
      }));
      setData(mappedData);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPuntiServizio();
  }, [fetchPuntiServizio]);

  const handleAddPuntoServizio = useCallback(() => {
    setSelectedPuntoServizioForEdit(null);
    setIsEditDialogOpen(true);
  }, []);

  const handleEdit = useCallback((puntoServizio: PuntoServizio) => {
    setSelectedPuntoServizioForEdit(puntoServizio);
    setIsEditDialogOpen(true);
  }, []);

  const handleViewDetails = useCallback((puntoServizio: PuntoServizioExtended) => {
    setSelectedPuntoServizioForDetails(puntoServizio);
    setIsDetailsDialogOpen(true);
  }, []);

  const handleSaveEdit = useCallback(() => {
    fetchPuntiServizio(); // Refresh data after save
    setIsEditDialogOpen(false);
    setSelectedPuntoServizioForEdit(null);
  }, [fetchPuntiServizio]);

  const handleCloseEditDialog = useCallback(() => {
    setIsEditDialogOpen(false);
    setSelectedPuntoServizioForEdit(null);
  }, []);

  const handleCloseDetailsDialog = useCallback(() => {
    setIsDetailsDialogOpen(false);
    setSelectedPuntoServizioForDetails(null);
  }, []);

  const handleDelete = async (puntoServizioId: string, puntoServizioName: string) => {
    if (window.confirm(`Sei sicuro di voler eliminare il punto di servizio "${puntoServizioName}"?`)) {
      const { error } = await supabase
        .from('punti_servizio')
        .delete()
        .eq('id', puntoServizioId);

      if (error) {
        showError(`Errore durante l'eliminazione del punto di servizio: ${error.message}`);
        console.error("Error deleting punto servizio:", error);
      } else {
        showSuccess(`Punto di servizio "${puntoServizioName}" eliminato con successo!`);
        fetchPuntiServizio(); // Refresh data after deletion
      }
    } else {
      showInfo(`Eliminazione del punto di servizio "${puntoServizioName}" annullata.`);
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
      const result: ImportResult = await importDataFromExcel(file, 'punti_servizio');
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
      fetchPuntiServizio();
    } catch (error: any) {
      showError(`Errore durante l'importazione: ${error.message}`);
      console.error("Import error:", error);
    } finally {
      setLoading(false);
      event.target.value = ''; // Clear the input so the same file can be selected again
    }
  };

  const filteredData = useMemo(() => {
    return data.filter(puntoServizio => {
      const searchLower = searchTerm.toLowerCase();
      return (
        puntoServizio.nome_punto_servizio.toLowerCase().includes(searchLower) ||
        (puntoServizio.indirizzo?.toLowerCase().includes(searchLower)) ||
        (puntoServizio.citta?.toLowerCase().includes(searchLower)) ||
        (puntoServizio.fornitori?.[0]?.nome_fornitore?.toLowerCase().includes(searchLower)) ||
        (puntoServizio.clienti?.[0]?.nome_cliente?.toLowerCase().includes(searchLower))
      );
    });
  }, [data, searchTerm]);

  const columns: ColumnDef<PuntoServizioExtended>[] = useMemo(() => [
    {
      accessorKey: "nome_punto_servizio",
      header: "Nome Punto Servizio",
      cell: ({ row }) => <span>{row.original.nome_punto_servizio}</span>,
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
      accessorKey: "fornitore_id",
      header: "Fornitore",
      cell: ({ row }) => <span>{row.original.fornitori?.[0]?.nome_fornitore || 'N/A'}</span>,
    },
    {
      accessorKey: "client_id",
      header: "Cliente",
      cell: ({ row }) => <span>{row.original.clienti?.[0]?.nome_cliente || 'N/A'}</span>,
    },
    {
      id: "posizione_gps", // New ID for the combined column
      header: "Posizione GPS",
      cell: ({ row }) => {
        const { latitude, longitude } = row.original;
        if (latitude !== undefined && latitude !== null && longitude !== undefined && longitude !== null) {
          const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
          return (
            <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center">
              <MapPin className="h-4 w-4 mr-1" /> Visualizza
            </a>
          );
        }
        return <span>N/A</span>;
      },
    },
    {
      id: "actions",
      header: "Azioni",
      cell: ({ row }) => (
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={() => handleViewDetails(row.original)} title="Visualizza Dettagli">
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleEdit(row.original)} title="Modifica">
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="destructive" size="sm" onClick={() => handleDelete(row.original.id!, row.original.nome_punto_servizio)} title="Elimina">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ], [handleEdit, handleDelete, handleViewDetails]);

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <Input
          placeholder="Cerca per nome, indirizzo, città, fornitore, cliente..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Button variant="outline" onClick={fetchPuntiServizio} disabled={loading}>
          <RefreshCcw className="mr-2 h-4 w-4" /> {loading ? 'Caricamento...' : 'Aggiorna Dati'}
        </Button>
        <Button onClick={handleAddPuntoServizio}>
          <PlusCircle className="mr-2 h-4 w-4" /> Aggiungi Punto Servizio
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
                  Caricamento punti di servizio...
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
                  Nessun punto di servizio trovato.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {selectedPuntoServizioForEdit && (
        <PuntiServizioEditDialog
          isOpen={isEditDialogOpen}
          onClose={handleCloseEditDialog}
          puntoServizio={selectedPuntoServizioForEdit}
          onSave={handleSaveEdit}
        />
      )}

      {selectedPuntoServizioForDetails && (
        <PuntoServizioDetailsDialog
          isOpen={isDetailsDialogOpen}
          onClose={handleCloseDetailsDialog}
          puntoServizio={selectedPuntoServizioForDetails}
        />
      )}
    </div>
  );
}