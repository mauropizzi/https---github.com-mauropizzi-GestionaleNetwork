"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
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
import { RefreshCcw, Eye, Folder, Filter } from 'lucide-react'; // Added Folder and Filter icons
import { showInfo, showError, showSuccess } from '@/utils/toast'; // Added showSuccess
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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
  folder: string; // Added folder column
}

const folderOptions = ["Inbox", "Archived", "Spam", "Trash"]; // Hardcoded folder options

const IncomingEmailsPage: React.FC = () => {
  const [data, setData] = useState<IncomingEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFolder, setFilterFolder] = useState<string>('All'); // New state for folder filter
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
      fetchIncomingEmails(); // Refresh data to reflect the change
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
      cell: ({ row }) => format(new Date(row.original.received_at), 'PPP HH:mm', { locale: it }),
    },
    {
      accessorKey: 'sender_name',
      header: 'Mittente',
      cell: ({ row }) => row.original.sender_name || row.original.sender_email,
    },
    {
      accessorKey: 'subject',
      header: 'Oggetto',
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
    getCoreRowModel: getCoreRowModel(),
  });

  return (
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
                  <SelectItem value="All">Tutte le Cartelle</SelectItem>
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
                  </TableHead>
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

      {selectedEmail && (
        <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Dettagli Email: {selectedEmail.subject}</DialogTitle>
              <DialogDescription>
                Da: {selectedEmail.sender_name || selectedEmail.sender_email} - Ricevuto il: {format(new Date(selectedEmail.received_at), 'PPP HH:mm', { locale: it })}
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="flex-1 p-4 border rounded-md my-4">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold">Oggetto:</h4>
                  <p>{selectedEmail.subject}</p>
                </div>
                <div>
                  <h4 className="font-semibold">Cartella:</h4>
                  <Select onValueChange={(value) => handleUpdateFolder(selectedEmail.id, value)} value={selectedEmail.folder}>
                    <SelectTrigger className="w-[180px]">
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
                </div>
                {selectedEmail.body_html ? (
                  <div>
                    <h4 className="font-semibold">Contenuto HTML:</h4>
                    <div dangerouslySetInnerHTML={{ __html: selectedEmail.body_html }} className="border p-2 rounded-md bg-gray-50 dark:bg-gray-700" />
                  </div>
                ) : (
                  <div>
                    <h4 className="font-semibold">Contenuto Testo:</h4>
                    <p className="whitespace-pre-wrap border p-2 rounded-md bg-gray-50 dark:bg-gray-700">{selectedEmail.body_text || 'Nessun contenuto testuale.'}</p>
                  </div>
                )}
                {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
                  <div>
                    <h4 className="font-semibold">Allegati:</h4>
                    <ul className="list-disc list-inside">
                      {selectedEmail.attachments.map((att: any, index: number) => (
                        <li key={index}>{att.Filename} ({att.ContentType})</li>
                      ))}
                    </ul>
                  </div>
                )}
                {selectedEmail.raw_email && (
                  <div>
                    <h4 className="font-semibold">Raw Email (per debug):</h4>
                    <pre className="whitespace-pre-wrap text-xs border p-2 rounded-md bg-gray-50 dark:bg-gray-700 overflow-x-auto">
                      {JSON.stringify(JSON.parse(selectedEmail.raw_email), null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </ScrollArea>
            <div className="flex justify-end">
              <Button onClick={() => setIsDetailsDialogOpen(false)}>Chiudi</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default IncomingEmailsPage;