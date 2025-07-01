"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel, // Corrected here
  useReactTable,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { RefreshCcw, Eye, Folder, Filter } from 'lucide-react';
import { showInfo, showError, showSuccess } from '@/utils/toast';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface IncomingEmail {
  id: string;
  received_at: string;
  sender_email: string;
  sender_name?: string | null;
  subject: string;
  body_text?: string | null;
  body_html?: string | null;
  attachments?: any | null;
  raw_email?: string | null;
  folder: string;
}

const folderOptions = ["Inbox", "Archived", "Spam", "Trash"];

const IncomingEmailsPage = () => {
  const [data, setData] = useState<IncomingEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFolder, setFilterFolder] = useState<string>('All');
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<IncomingEmail | null>(null);

  const fetchIncomingEmails = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('incoming_emails')
      .select('*')
      .order('received_at', { ascending: false });

    if (error) {
      showError(`Errore nel recupero delle email in arrivo: ${error.message}`);
      console.error("Error fetching incoming emails:", error);
      setData([]);
    } else {
      setData(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchIncomingEmails();
  }, [fetchIncomingEmails]);

  const handleViewDetails = useCallback((email: IncomingEmail) => {
    setSelectedEmail(email);
    setIsDetailsDialogOpen(true);
  }, []);

  const handleUpdateFolder = useCallback(async (emailId: string, newFolder: string) => {
    const { error } = await supabase
      .from('incoming_emails')
      .update({ folder: newFolder })
      .eq('id', emailId);

    if (error) {
      showError(`Errore durante l'aggiornamento della cartella: ${error.message}`);
      console.error("Error updating email folder:", error);
    } else {
      showSuccess(`Email spostata in "${newFolder}" con successo!`);
      fetchIncomingEmails();
    }
  }, [fetchIncomingEmails]);

  const filteredData = useMemo(() => {
    return data.filter(email => {
      const matchesSearch = searchTerm.toLowerCase() === '' ||
        email.sender_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (email.sender_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (email.body_text?.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesFolder = filterFolder === 'All' || email.folder === filterFolder;

      return matchesSearch && matchesFolder;
    });
  }, [data, searchTerm, filterFolder]);

  const columns: ColumnDef<IncomingEmail>[] = useMemo(() => [
    {
      accessorKey: 'received_at',
      header: 'Ricevuto il',
      cell: ({ row }) => <span>{format(new Date(row.original.received_at), 'PPP HH:mm', { locale: it })}</span>,
    },
    {
      accessorKey: 'sender_name',
      header: 'Mittente',
      cell: ({ row }) => <span>{row.original.sender_name || row.original.sender_email}</span>,
    },
    {
      accessorKey: 'subject',
      header: 'Oggetto',
      cell: ({ row }) => <span>{row.original.subject}</span>,
    },
    {
      accessorKey: 'folder',
      header: 'Cartella',
      cell: ({ row }) => (
        <Select onValueChange={(value) => handleUpdateFolder(row.original.id, value)} value={row.original.folder}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Seleziona cartella" />
          </SelectTrigger>
          <SelectContent>
            {folderOptions.map(folder => (
              <SelectItem key={folder} value={folder}>
                {folder}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ),
    },
    {
      id: 'actions',
      header: 'Azioni',
      cell: ({ row }) => (
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={() => handleViewDetails(row.original)} title="Visualizza Dettagli">
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ], [handleViewDetails, handleUpdateFolder]);

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(), // Corrected here
  });

  return (
    <React.Fragment>
      <div className="container mx-auto p-4">
        <Card className="w-full max-w-6xl mx-auto">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center">Email in Arrivo</CardTitle>
            <CardDescription className="text-center">Visualizza tutte le email ricevute tramite webhook.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 items-center mb-4">
              <Input
                placeholder="Cerca per mittente o oggetto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <Select onValueChange={setFilterFolder} value={filterFolder}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filtra per cartella" />
                  </SelectTrigger>
                  <SelectContent>
                    {folderOptions.map(folder => (
                      <SelectItem key={folder} value={folder}>
                        {folder}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" onClick={fetchIncomingEmails} disabled={loading}>
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
                        Caricamento email...
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
                        Nessuna email trovata.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {selectedEmail && (
        <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Dettagli Email: {selectedEmail.subject}</DialogTitle>
              <DialogDescription>
                Da: {selectedEmail.sender_name || selectedEmail.sender_email} - Ricevuto il: {format(new Date(selectedEmail.received_at), 'PPP HH:mm', { locale: it })}
              </DialogDescription>
            </DialogHeader>
            {/* Sostituito React.Fragment con un singolo div per l'area del contenuto principale */}
            <div className="flex-1 overflow-y-auto p-4">
              <div>
                <p className="font-semibold mb-2">Oggetto: {selectedEmail.subject}</p>
              </div>
              {selectedEmail.body_text && (
                <div className="mt-4 p-2 bg-gray-50 dark:bg-gray-700 rounded-md text-sm whitespace-pre-wrap">
                  <h4 className="font-semibold mb-2">Testo Email:</h4>
                  <p>{selectedEmail.body_text}</p>
                </div>
              )}
              {selectedEmail.body_html && (
                <div className="mt-4 p-2 bg-gray-50 dark:bg-gray-700 rounded-md text-sm">
                  <h4 className="font-semibold mb-2">HTML Email (parziale):</h4>
                  {/* Render HTML content, but be cautious with untrusted HTML */}
                  <div dangerouslySetInnerHTML={{ __html: selectedEmail.body_html.substring(0, 500) + (selectedEmail.body_html.length > 500 ? '...' : '') }} />
                </div>
              )}
              {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-semibold mb-2">Allegati:</h4>
                  <ul className="list-disc list-inside text-sm">
                    {selectedEmail.attachments.map((att: any, idx: number) => (
                      <li key={idx}>{att.filename} ({att.contentType}, {Math.round(att.size / 1024)} KB)</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <DialogFooter> {/* Utilizzato DialogFooter per il pulsante */}
              <Button onClick={() => setIsDetailsDialogOpen(false)}>Chiudi</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </React.Fragment>
  );
};

export default IncomingEmailsPage;