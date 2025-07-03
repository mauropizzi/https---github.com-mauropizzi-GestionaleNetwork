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
import { format, parseISO } from "date-fns";
import { it } from 'date-fns/locale';
import { Mail, Printer, RotateCcw, RefreshCcw } from "lucide-react";
import { showInfo, showError, showSuccess } from "@/utils/toast";
import { supabase } from "@/integrations/supabase/client";
import { sendEmail } from "@/utils/email";
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useNavigate } from "react-router-dom"; // Import useNavigate

interface CantiereReport {
  id: string;
  report_date: string;
  report_time: string;
  client_id: string;
  site_name: string;
  employee_id: string;
  service_provided: string;
  start_datetime?: string | null;
  end_datetime?: string | null;
  notes?: string;
  automezziCount: number;
  attrezziCount: number;
  nome_cliente?: string;
  nome_addetto?: string;
  status?: string;
}

const generateCantierePdfBlob = async (reportId: string): Promise<Blob | null> => {
  const { data: report, error: reportError } = await supabase
    .from('registri_cantiere')
    .select('*, clienti(nome_cliente), addetto:personale!employee_id(nome, cognome), addetto_riconsegna:personale!addetto_riconsegna_security_service(nome, cognome)')
    .eq('id', reportId)
    .single();

  if (reportError || !report) {
    showError(`Errore nel recupero del rapporto: ${reportError?.message}`);
    return null;
  }

  const { data: automezzi, error: automezziError } = await supabase
    .from('automezzi_utilizzati')
    .select('*')
    .eq('registro_cantiere_id', reportId);

  const { data: attrezzi, error: attrezziError } = await supabase
    .from('attrezzi_utilizzati')
    .select('*')
    .eq('registro_cantiere_id', reportId);

  if (automezziError || attrezziError) {
    showError(`Errore nel recupero dei dettagli del rapporto.`);
    return null;
  }

  const doc = new jsPDF();
  let y = 20;
  doc.setFontSize(18);
  doc.text("Rapporto di Cantiere", 14, y);
  y += 10;
  doc.setFontSize(10);

  let body = `Data Rapporto: ${format(parseISO(report.report_date), 'dd/MM/yyyy')}\n`;
  body += `Ora Rapporto: ${report.report_time}\n`;
  body += `Cliente: ${report.clienti?.nome_cliente || 'N/A'}\n`;
  body += `Punto Servizio / Cantiere: ${report.site_name}\n`;
  body += `Addetto Security Service: ${report.addetto ? `${report.addetto.nome} ${report.addetto.cognome}` : 'N/A'}\n`;
  body += `Servizio: ${report.service_provided}\n`;
  body += `Inizio Servizio: ${report.start_datetime ? format(parseISO(report.start_datetime), 'dd/MM/yyyy HH:mm') : 'N/A'}\n`;
  body += `Fine Servizio: ${report.end_datetime ? format(parseISO(report.end_datetime), 'dd/MM/yyyy HH:mm') : 'N/A'}\n`;

  if (automezzi && automezzi.length > 0) {
    body += `\n--- Automezzi Presenti ---\n`;
    automezzi.forEach((auto, index) => {
      body += `Automezzo ${index + 1}: Tipologia: ${auto.tipologia}, Marca: ${auto.marca}, Targa: ${auto.targa}\n`;
    });
  }

  if (attrezzi && attrezzi.length > 0) {
    body += `\n--- Attrezzi Presenti ---\n`;
    attrezzi.forEach((attrezzo, index) => {
      body += `Attrezzo ${index + 1}: Tipologia: ${attrezzo.tipologia}, Marca: ${attrezzo.marca}, Quantità: ${attrezzo.quantita}\n`;
    });
  }

  if (report.notes) {
    body += `\n--- Note Varie ---\n${report.notes}\n`;
  }

  body += `\n--- Riconsegna Cantiere ---\n`;
  body += `Addetto Security Service Riconsegna: ${report.addetto_riconsegna ? `${report.addetto_riconsegna.nome} ${report.addetto_riconsegna.cognome}` : 'N/A'}\n`;
  body += `Responsabile Committente Riconsegna: ${report.responsabile_committente_riconsegna || 'N/A'}\n`;
  body += `ESITO SERVIZIO: ${report.esito_servizio || 'N/A'}\n`;
  body += `CONSEGNE di Servizio: ${report.consegne_servizio || 'N/A'}\n`;

  doc.text(body, 14, y);
  return doc.output('blob');
};

export function CantiereHistoryTable() {
  const navigate = useNavigate(); // Initialize useNavigate
  const [data, setData] = useState<CantiereReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDate, setFilterDate] = useState<string>("");

  const fetchCantiereReports = useCallback(async () => {
    setLoading(true);
    const { data: reportsData, error } = await supabase
      .from('registri_cantiere')
      .select('id, report_date, report_time, client_id, site_name, employee_id, service_provided, start_datetime, end_datetime, notes, status, clienti(nome_cliente), addetto:personale!employee_id(nome, cognome)');

    if (error) {
      showError(`Errore nel recupero dei rapporti di cantiere: ${error.message}`);
      console.error("Error fetching registri_cantiere:", error);
      setData([]);
      setLoading(false);
      return;
    }

    const reportsWithCounts = await Promise.all(reportsData.map(async (report) => {
      const { count: automezziCount, error: automezziError } = await supabase
        .from('automezzi_utilizzati')
        .select('id', { count: 'exact', head: true })
        .eq('registro_cantiere_id', report.id);

      const { count: attrezziCount, error: attrezziError } = await supabase
        .from('attrezzi_utilizzati')
        .select('id', { count: 'exact', head: true })
        .eq('registro_cantiere_id', report.id);

      if (automezziError) console.error("Error fetching automezzi count:", automezziError);
      if (attrezziError) console.error("Error fetching attrezzi count:", attrezziError);

      return {
        ...report,
        nome_cliente: report.clienti?.nome_cliente || 'N/A',
        nome_addetto: report.addetto ? `${report.addetto.nome} ${report.addetto.cognome}` : 'N/A',
        automezziCount: automezziCount || 0,
        attrezziCount: attrezziCount || 0,
      };
    }));

    setData(reportsWithCounts || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCantiereReports();
  }, [fetchCantiereReports]);

  const handleEmailReport = useCallback(async (report: CantiereReport) => {
    showInfo(`Preparazione email per il rapporto ${report.id}...`);
    const pdfBlob = await generateCantierePdfBlob(report.id);
    if (pdfBlob) {
      const reader = new FileReader();
      reader.readAsDataURL(pdfBlob);
      reader.onloadend = () => {
        const base64data = reader.result?.toString().split(',')[1];
        if (base64data) {
          const subject = `Rapporto di Cantiere - ${report.nome_cliente} - ${report.site_name} - ${format(parseISO(report.report_date), 'dd/MM/yyyy')}`;
          const textBody = "Si trasmettono in allegato i dettagli del rapporto di cantiere.\n\nCordiali saluti.";
          sendEmail(subject, textBody, false, {
            filename: `Rapporto_Cantiere_${report.id}.pdf`,
            content: base64data,
            contentType: 'application/pdf'
          });
        } else {
          showError("Errore nella conversione del PDF in Base64.");
        }
      };
      reader.onerror = () => {
        showError("Errore nella lettura del file PDF.");
      };
    }
  }, []);

  const handlePrintReport = useCallback(async (reportId: string) => {
    showInfo(`Generazione PDF per il rapporto ${reportId}...`);
    const pdfBlob = await generateCantierePdfBlob(reportId);
    if (pdfBlob) {
      const url = URL.createObjectURL(pdfBlob);
      window.open(url, '_blank');
      showSuccess("PDF generato con successo!");
    }
  }, []);

  const handleRestore = useCallback((reportId: string) => {
    showInfo(`Caricamento rapporto ${reportId} per la modifica...`);
    navigate(`/registro-di-cantiere?tab=nuovo-rapporto&restoreId=${reportId}`);
  }, [navigate]);

  const filteredData = useMemo(() => {
    return data.filter(report => {
      const matchesSearch = searchTerm === "" ||
        report.nome_cliente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.site_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.nome_addetto?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.service_provided.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.status?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesDate = filterDate === "" ||
        report.report_date === filterDate;

      return matchesSearch && matchesDate;
    });
  }, [data, searchTerm, filterDate]);

  const columns: ColumnDef<CantiereReport>[] = useMemo(() => [
    {
      accessorKey: "report_date",
      header: "Data Rapporto",
      cell: ({ row }) => {
        const date = (row.original.report_date && typeof row.original.report_date === 'string') ? parseISO(row.original.report_date) : null;
        return <span>{date ? format(date, "PPP", { locale: it }) : "N/A"}</span>;
      },
    },
    {
      accessorKey: "nome_cliente",
      header: "Cliente",
      cell: ({ row }) => <span>{row.original.nome_cliente}</span>,
    },
    {
      accessorKey: "site_name",
      header: "Cantiere",
      cell: ({ row }) => <span>{row.original.site_name}</span>,
    },
    {
      accessorKey: "nome_addetto",
      header: "Addetto",
      cell: ({ row }) => <span>{row.original.nome_addetto}</span>,
    },
    {
      accessorKey: "service_provided",
      header: "Servizio",
      cell: ({ row }) => <span>{row.original.service_provided}</span>,
    },
    {
      accessorKey: "start_datetime",
      header: "Inizio Servizio",
      cell: ({ row }) => {
        const date = row.original.start_datetime ? parseISO(row.original.start_datetime) : null;
        return <span>{date ? format(date, "dd/MM/yyyy HH:mm", { locale: it }) : "N/A"}</span>;
      },
    },
    {
      accessorKey: "end_datetime",
      header: "Fine Servizio",
      cell: ({ row }) => {
        const date = row.original.end_datetime ? parseISO(row.original.end_datetime) : null;
        return <span>{date ? format(date, "dd/MM/yyyy HH:mm", { locale: it }) : "N/A"}</span>;
      },
    },
    {
      accessorKey: "status",
      header: "Stato",
      cell: ({ row }) => <span>{row.original.status || 'N/A'}</span>,
    },
    {
      id: "actions",
      header: "Azioni",
      cell: ({ row }) => (
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={() => handleEmailReport(row.original)}>
            <Mail className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => handlePrintReport(row.original.id)}>
            <Printer className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleRestore(row.original.id)} title="Ripristina per modifica">
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ], [handleEmailReport, handlePrintReport, handleRestore]);

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        <Input
          placeholder="Cerca per cliente, cantiere, addetto..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="max-w-xs"
        />
        <Button variant="outline" onClick={() => { setSearchTerm(""); setFilterDate(""); }}>
          Reset Filtri
        </Button>
        <Button variant="outline" onClick={fetchCantiereReports} disabled={loading}>
          <RefreshCcw className="mr-2 h-4 w-4" /> {loading ? 'Caricamento...' : 'Aggiorna Dati'}
        </Button>
      </div>
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Caricamento rapporti di cantiere...
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
                  Nessun rapporto di cantiere trovato.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}