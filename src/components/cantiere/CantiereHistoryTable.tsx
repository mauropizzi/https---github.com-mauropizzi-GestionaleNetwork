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
import { Edit, Trash2, RefreshCcw, Eye } from "lucide-react";
import { showInfo, showError, showSuccess } from "@/utils/toast";
import { supabase } from "@/integrations/supabase/client";
import { RegistroDiCantiere as RegistroDiCantiereBase } from "@/lib/anagrafiche-data"; // Corrected import
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { CantiereReportForm } from "./CantiereReportForm"; // Corrected import
import { CantiereReportDetailsDialog } from "./CantiereReportDetailsDialog"; // Corrected import

// Extend RegistroDiCantiereBase to include joined data
interface RegistroDiCantiere extends RegistroDiCantiereBase {
  clienti: { nome_cliente: string }[];
  addetto: { nome: string; cognome: string }[];
  automezzi_utilizzati?: Array<{ tipologia: string; marca: string; targa: string }> | null;
  attrezzi_utilizzati?: Array<{ tipologia: string; marca: string; quantita: number }> | null;
}

export function CantiereHistoryTable() {
  const [data, setData] = useState<RegistroDiCantiere[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedReportForEdit, setSelectedReportForEdit] = useState<RegistroDiCantiere | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedReportForDetails, setSelectedReportForDetails] = useState<RegistroDiCantiere | null>(null);

  const fetchCantiereReports = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('registri_cantiere') // Corrected table name
      .select('*, clienti(nome_cliente), addetto:personale(nome, cognome), automezzi_utilizzati(*), attrezzi_utilizzati(*)') // Select all from reports, nome_cliente from clienti, nome and cognome from personale (aliased as addetto)
      .order('report_date', { ascending: false })
      .order('report_time', { ascending: false });

    if (error) {
      showError(`Errore nel recupero dei report cantiere: ${error.message}`);
      console.error("Error fetching cantiere reports:", error);
      setData([]);
    } else {
      const mappedData: RegistroDiCantiere[] = data.map(report => ({
        ...report,
        clienti: report.clienti || [],
        addetto: report.addetto || [],
        automezzi_utilizzati: report.automezzi_utilizzati || [],
        attrezzi_utilizzati: report.attrezzi_utilizzati || [],
      }));
      setData(mappedData);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCantiereReports();
  }, [fetchCantiereReports]);

  const handleEdit = useCallback((report: RegistroDiCantiere) => {
    setSelectedReportForEdit(report);
    setIsEditDialogOpen(true);
  }, []);

  const handleViewDetails = useCallback((report: RegistroDiCantiere) => {
    setSelectedReportForDetails(report);
    setIsDetailsDialogOpen(true);
  }, []);

  const handleSaveEdit = useCallback(() => {
    fetchCantiereReports(); // Refresh data after save
    setIsEditDialogOpen(false);
    setSelectedReportForEdit(null);
  }, [fetchCantiereReports]);

  const handleCloseEditDialog = useCallback(() => {
    setIsEditDialogOpen(false);
    setSelectedReportForEdit(null);
  }, []);

  const handleCloseDetailsDialog = useCallback(() => {
    setIsDetailsDialogOpen(false);
    setSelectedReportForDetails(null);
  }, []);

  const handleDelete = async (reportId: string, reportDescription: string) => {
    if (window.confirm(`Sei sicuro di voler eliminare il report "${reportDescription}"?`)) {
      const { error } = await supabase
        .from('registri_cantiere') // Corrected table name
        .delete()
        .eq('id', reportId);

      if (error) {
        showError(`Errore durante l'eliminazione del report: ${error.message}`);
        console.error("Error deleting cantiere report:", error);
      } else {
        showSuccess(`Report "${reportDescription}" eliminato con successo!`);
        fetchCantiereReports(); // Refresh data after deletion
      }
    } else {
      showInfo(`Eliminazione del report "${reportDescription}" annullata.`);
    }
  };

  const filteredData = useMemo(() => {
    return data.filter(report => {
      const searchLower = searchTerm.toLowerCase();
      return (
        report.site_name.toLowerCase().includes(searchLower) ||
        (report.clienti && report.clienti[0]?.nome_cliente?.toLowerCase().includes(searchLower)) ||
        (report.addetto && `${report.addetto[0]?.nome} ${report.addetto[0]?.cognome}`.toLowerCase().includes(searchLower)) ||
        report.service_provided.toLowerCase().includes(searchLower)
      );
    });
  }, [data, searchTerm]);

  const columns: ColumnDef<RegistroDiCantiere>[] = useMemo(() => [
    {
      accessorKey: "report_date",
      header: "Data Report",
      cell: ({ row }) => <span>{new Date(row.original.report_date).toLocaleDateString()}</span>,
    },
    {
      accessorKey: "report_time",
      header: "Ora Report",
      cell: ({ row }) => <span>{row.original.report_time}</span>,
    },
    {
      accessorKey: "site_name",
      header: "Nome Cantiere",
      cell: ({ row }) => <span>{row.original.site_name}</span>,
    },
    {
      accessorKey: "client_id",
      header: "Cliente",
      cell: ({ row }) => <span>{row.original.clienti[0]?.nome_cliente || 'N/A'}</span>,
    },
    {
      accessorKey: "employee_id",
      header: "Addetto",
      cell: ({ row }) => <span>{`${row.original.addetto[0]?.nome || ''} ${row.original.addetto[0]?.cognome || ''}`.trim() || 'N/A'}</span>,
    },
    {
      accessorKey: "service_provided",
      header: "Servizio Fornito",
      cell: ({ row }) => <span className="line-clamp-2">{row.original.service_provided}</span>,
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
          <Button variant="destructive" size="sm" onClick={() => handleDelete(row.original.id!, row.original.site_name)} title="Elimina">
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
          placeholder="Cerca per cantiere, cliente, addetto, servizio..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Button variant="outline" onClick={fetchCantiereReports} disabled={loading}>
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
                  Caricamento report cantiere...
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
                  Nessun report cantiere trovato.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {selectedReportForEdit && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Modifica Report Cantiere</DialogTitle>
              <DialogDescription>
                Apporta modifiche ai dettagli del report.
              </DialogDescription>
            </DialogHeader>
            <CantiereReportForm
              report={selectedReportForEdit}
              onSaveSuccess={handleSaveEdit}
              onCancel={handleCloseEditDialog}
            />
          </DialogContent>
        </Dialog>
      )}

      {selectedReportForDetails && (
        <CantiereReportDetailsDialog
          isOpen={isDetailsDialogOpen}
          onClose={handleCloseDetailsDialog}
          report={selectedReportForDetails}
        />
      )}
    </div>
  );
}