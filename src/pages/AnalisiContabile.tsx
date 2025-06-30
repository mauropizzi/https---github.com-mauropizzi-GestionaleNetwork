import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Cliente, PuntoServizio } from "@/lib/anagrafiche-data";
import { fetchClienti, fetchPuntiServizio, fetchServiceRequestsForAnalysis } from "@/lib/data-fetching";
import { showError } from "@/utils/toast";
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { RefreshCcw } from "lucide-react";
import { Label } from "@/components/ui/label"; // Import Label

interface ServiceSummary {
  servicePointId: string;
  servicePointName: string;
  totalServices: number;
  totalCost: number; // Sum of calculated_cost
}

const AnalisiContabile = () => {
  const [clientsList, setClientsList] = useState<Cliente[]>([]);
  const [puntiServizioMap, setPuntiServizioMap] = useState<Map<string, PuntoServizio>>(new Map());
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [summaryData, setSummaryData] = useState<ServiceSummary[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch initial data: clients and service points
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        const fetchedClients = await fetchClienti();
        setClientsList(fetchedClients);

        const fetchedPuntiServizio = await fetchPuntiServizio();
        const psMap = new Map<string, PuntoServizio>();
        fetchedPuntiServizio.forEach(ps => psMap.set(ps.id, ps));
        setPuntiServizioMap(psMap);

        // Set a default client if available, or 'All'
        if (fetchedClients.length > 0) {
          setSelectedClientId(fetchedClients[0].id); // Select first client by default
        } else {
          setSelectedClientId(null); // No clients available
        }
      } catch (err) {
        showError("Errore nel caricamento dei dati iniziali.");
        console.error("Error loading initial data:", err);
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  }, []);

  // Fetch and process service data based on selected client
  const fetchAndProcessServiceData = useCallback(async () => {
    setLoading(true);
    try {
      const rawServices = await fetchServiceRequestsForAnalysis(selectedClientId || undefined);

      const summary: { [key: string]: ServiceSummary } = {};

      rawServices.forEach(service => {
        const servicePoint = puntiServizioMap.get(service.service_point_id);
        if (servicePoint) {
          if (!summary[servicePoint.id]) {
            summary[servicePoint.id] = {
              servicePointId: servicePoint.id,
              servicePointName: servicePoint.nome_punto_servizio,
              totalServices: 0,
              totalCost: 0,
            };
          }
          summary[servicePoint.id].totalServices += 1;
          if (service.calculated_cost) {
            summary[servicePoint.id].totalCost += service.calculated_cost;
          }
        }
      });

      setSummaryData(Object.values(summary));
    } catch (err) {
      showError("Errore nel recupero o nell'elaborazione dei dati dei servizi.");
      console.error("Error fetching or processing service data:", err);
      setSummaryData([]);
    } finally {
      setLoading(false);
    }
  }, [selectedClientId, puntiServizioMap]);

  useEffect(() => {
    if (puntiServizioMap.size > 0 || clientsList.length > 0) { // Ensure service points and clients are loaded before fetching service data
      fetchAndProcessServiceData();
    }
  }, [selectedClientId, puntiServizioMap, clientsList, fetchAndProcessServiceData]);


  const columns: ColumnDef<ServiceSummary>[] = useMemo(() => [
    {
      accessorKey: "servicePointName",
      header: "Punto Servizio",
    },
    {
      accessorKey: "totalServices",
      header: "Totale Servizi",
    },
    {
      accessorKey: "totalCost",
      header: "Costo Totale (€)",
      cell: ({ row }) => `${row.original.totalCost.toFixed(2)} €`,
    },
  ], []);

  const table = useReactTable({
    data: summaryData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="container mx-auto p-4">
      <Card className="w-full max-w-6xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">Analisi Contabile</CardTitle>
          <CardDescription className="text-center">
            Sintesi dei servizi svolti per punto servizio, con possibilità di filtro per cliente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 items-center mb-4">
            <div className="w-full md:w-1/2">
              <Label htmlFor="client-select">Seleziona Cliente</Label>
              <Select
                onValueChange={(value) => setSelectedClientId(value === "all" ? null : value)}
                value={selectedClientId || "all"}
                disabled={loading}
              >
                <SelectTrigger id="client-select">
                  <SelectValue placeholder="Tutti i Clienti" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti i Clienti</SelectItem>
                  {clientsList.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.nome_cliente}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={fetchAndProcessServiceData} disabled={loading} className="mt-auto">
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
                      Caricamento dati di analisi...
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
                      Nessun dato di servizio trovato per i criteri selezionati.
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

export default AnalisiContabile;