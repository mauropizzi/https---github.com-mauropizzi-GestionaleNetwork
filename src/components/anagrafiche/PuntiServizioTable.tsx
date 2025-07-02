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
import { Edit, Trash2, RefreshCcw, Eye, MapPin } from "lucide-react"; // Import MapPin icon
import { showInfo, showError, showSuccess } from "@/utils/toast";
import { supabase } from "@/integrations/supabase/client";
import { PuntoServizio, Cliente, Fornitore } from "@/lib/anagrafiche-data";
import { fetchClienti, fetchFornitori } from "@/lib/data-fetching";
import { PuntiServizioEditDialog } from "./PuntiServizioEditDialog";
import { PuntiServizioDetailsDialog } from "./PuntiServizioDetailsDialog"; // Import the new dialog

interface PuntoServizioExtended extends PuntoServizio {
  nome_cliente?: string;
  nome_fornitore?: string;
  procedure?: { nome_procedura: string } | null; // Aggiunto per il nome della procedura
}

export function PuntiServizioTable() {
  const [data, setData] = useState<PuntoServizioExtended[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedPuntoServizioForEdit, setSelectedPuntoServizioForEdit] = useState<PuntoServizioExtended | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false); // New state for details dialog
  const [selectedPuntoServizioForDetails, setSelectedPuntoServizioForDetails] = useState<PuntoServizioExtended | null>(null); // New state for details dialog

  const fetchPuntiServizioData = useCallback(async () => {
    setLoading(true);
    console.log("Fetching punti_servizio data from Supabase...");
    const { data: puntiServizioData, error: puntiServizioError } = await supabase
      .from('punti_servizio')
      .select('*, clienti(nome_cliente), fornitori(nome_fornitore), procedure(nome_procedura)'); // Fetch related client, supplier, and procedure names

    if (puntiServizioError) {
      showError(`Errore nel recupero dei punti servizio: ${puntiServizioError.message}`);
      console.error("Error fetching punti_servizio:", puntiServizioError);
      setData([]);
    } else {
      console.log("Raw fetched punti_servizio data:", puntiServizioData); // Log raw data
      const mappedData = puntiServizioData.map(ps => {
        console.log(`Fetched point name: ${ps.nome_punto_servizio}`); // Log each point name
        return {
          ...ps,
          nome_cliente: ps.clienti?.nome_cliente || 'N/A',
          nome_fornitore: ps.fornitori?.nome_fornitore || 'N/A',
          procedure: ps.procedure || null, // Mappa la procedura
        };
      });
      setData(mappedData || []);
      console.log("Mapped punti_servizio data for table:", mappedData); // Log mapped data
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPuntiServizioData();
  }, [fetchPuntiServizioData]);

  const handleView = useCallback((puntoServizio: PuntoServizioExtended) => {
    setSelectedPuntoServizioForDetails(puntoServizio);
    setIsDetailsDialogOpen(true);
  }, []);

  const handleEdit = useCallback((puntoServizio: PuntoServizioExtended) => {
    setSelectedPuntoServizioForEdit(puntoServizio);
    setIsEditDialogOpen(true);
  }, []);

  const handleSaveEdit = useCallback((updatedPuntoServizio: PuntoServizio) => {
    // Update local state to reflect changes immediately
    setData(prevData =>
      prevData.map(p =>
        p.id === updatedPuntoServizio.id ? { ...p, ...updatedPuntoServizio } : p
      )
    );
    // Optionally, refetch all data to ensure consistency with backend
    fetchPuntiServizioData(); // Re-fetch to get updated client/supplier/procedure names if they changed
    setIsEditDialogOpen(false);
    setSelectedPuntoServizioForEdit(null);
  }, [fetchPuntiServizioData]);

  const handleCloseEditDialog = useCallback(() => {
    setIsEditDialogOpen(false);
    setSelectedPuntoServizioForEdit(null);
  }, []);

  const handleCloseDetailsDialog = useCallback(() => {
    setIsDetailsDialogOpen(false);
    setSelectedPuntoServizioForDetails(null);
  }, []);

  const handleDelete = async (puntoServizioId: string, nomePuntoServizio: string) => {
    if (window.confirm(`Sei sicuro di voler eliminare il punto servizio "${nomePuntoServizio}"?`)) {
      const { error } = await supabase
        .from('punti_servizio')
        .delete()
        .eq('id', puntoServizioId);

      if (error) {
        showError(`Errore durante l'eliminazione del punto servizio: ${error.message}`);
        console.error("Error deleting punto_servizio:", error);
      } else {
        showSuccess(`Punto servizio "${nomePuntoServizio}" eliminato con successo!`);
        fetchPuntiServizioData(); // Refresh data after deletion
      }
    } else {
      showInfo(`Eliminazione del punto servizio "${nomePuntoServizio}" annullata.`);
    }
  };

  const filteredData = useMemo(() => {
    console.log("Current search term:", searchTerm);
    const searchLower = searchTerm.toLowerCase().trim(); // Also trim the search term
    const filtered = data.filter(punto => {
      const nomePuntoServizioLower = (punto.nome_punto_servizio || '').toLowerCase().trim();
      const nomeClienteLower = (punto.nome_cliente || '').toLowerCase().trim();
      const indirizzoLower = (punto.indirizzo || '').toLowerCase().trim();
      const cittaLower = (punto.citta || '').toLowerCase().trim();
      const referenteLower = (punto.referente || '').toLowerCase().trim();
      const nomeProceduraLower = (punto.procedure?.nome_procedura || '').toLowerCase().trim(); // Nuovo campo

      const matches =
        nomePuntoServizioLower.includes(searchLower) ||
        nomeClienteLower.includes(searchLower) ||
        indirizzoLower.includes(searchLower) ||
        cittaLower.includes(searchLower) ||
        referenteLower.includes(searchLower) ||
        nomeProceduraLower.includes(searchLower); // Includi la ricerca per nome procedura

      // Detailed logging for each item when there's an active search term
      if (searchTerm.length > 0) {
        console.log(`--- Checking item: ${punto.nome_punto_servizio} (ID: ${punto.id}) ---`);
        console.log(`  Search term (trimmed, lower): "${searchLower}"`);
        console.log(`  nome_punto_servizio (raw): "${punto.nome_punto_servizio}"`);
        console.log(`  nome_punto_servizio (processed): "${nomePuntoServizioLower}"`);
        console.log(`  nome_punto_servizio match: ${nomePuntoServizioLower.includes(searchLower)}`);
        console.log(`  nome_cliente (raw): "${punto.nome_cliente}"`);
        console.log(`  nome_cliente (processed): "${nomeClienteLower}"`);
        console.log(`  nome_cliente match: ${nomeClienteLower.includes(searchLower)}`);
        console.log(`  indirizzo (raw): "${punto.indirizzo}"`);
        console.log(`  indirizzo (processed): "${indirizzoLower}"`);
        console.log(`  indirizzo match: ${indirizzoLower.includes(searchLower)}`);
        console.log(`  citta (raw): "${punto.citta}"`);
        console.log(`  citta (processed): "${cittaLower}"`);
        console.log(`  citta match: ${cittaLower.includes(searchLower)}`);
        console.log(`  referente (raw): "${punto.referente}"`);
        console.log(`  referente (processed): "${referenteLower}"`);
        console.log(`  referente match: ${referenteLower.includes(searchLower)}`);
        console.log(`  nome_procedura (raw): "${punto.procedure?.nome_procedura}"`); // Log nuovo campo
        console.log(`  nome_procedura (processed): "${nomeProceduraLower}"`); // Log nuovo campo
        console.log(`  nome_procedura match: ${nomeProceduraLower.includes(searchLower)}`); // Log nuovo campo
        console.log(`  Overall match for ${punto.nome_punto_servizio}: ${matches}`);
        console.log("----------------------------------------------------");
      }
      return matches;
    });
    console.log("Filtered data for table:", filtered);
    return filtered;
  }, [data, searchTerm]);

  const columns: ColumnDef<PuntoServizioExtended>[] = useMemo(() => [
    {
      accessorKey: "nome_punto_servizio",
      header: "Nome Punto Servizio",
    },
    {
      accessorKey: "nome_cliente",
      header: "Cliente Associato",
    },
    {
      accessorKey: "indirizzo",
      header: "Indirizzo",
    },
    {
      accessorKey: "citta",
      header: "Città",
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
          <Button variant="outline" size="sm" onClick={() => handleView(row.original)} title="Visualizza Dettagli">
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleEdit(row.original)} title="Modifica">
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="destructive" size="sm" onClick={() => handleDelete(row.original.id, row.original.nome_punto_servizio)} title="Elimina">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ], [handleEdit, handleDelete, handleView]);

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <Input
          placeholder="Cerca per nome, indirizzo, città..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Button variant="outline" onClick={fetchPuntiServizioData} disabled={loading}>
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
                  Caricamento punti servizio...
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
                  Nessun punto servizio trovato.
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
        <PuntiServizioDetailsDialog
          isOpen={isDetailsDialogOpen}
          onClose={handleCloseDetailsDialog}
          puntoServizio={selectedPuntoServizioForDetails}
        />
      )}
    </div>
  );
}