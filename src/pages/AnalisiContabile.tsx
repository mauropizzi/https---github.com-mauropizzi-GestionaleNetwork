import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Cliente, PuntoServizio } from "@/lib/anagrafiche-data";
import { fetchClienti, fetchPuntiServizio, fetchServiceRequestsForAnalysis, fetchAllTariffe } from "@/lib/data-fetching";
import { showError } from "@/utils/toast";
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { RefreshCcw } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, isWithinInterval, parseISO } from "date-fns";
import { it } from 'date-fns/locale';

interface ServiceSummary {
  servicePointId: string;
  servicePointName: string;
  totalServices: number;
  totalCost: number; // Sum of calculated_cost
}

interface MissingTariffEntry {
  serviceId: string;
  serviceType: string;
  clientName: string;
  servicePointName?: string;
  startDate: string; // ISO date string
  reason: string; // e.g., "No matching tariff found", "Tariff expired"
}

const AnalisiContabile = () => {
  const [currentTab, setCurrentTab] = useState("sintesi-contabile");
  const [clientsList, setClientsList] = useState<Cliente[]>([]);
  const [puntiServizioMap, setPuntiServizioMap] = useState<Map<string, PuntoServizio>>(new Map());
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [summaryData, setSummaryData] = useState<ServiceSummary[]>([]);
  const [missingTariffs, setMissingTariffs] = useState<MissingTariffEntry[]>([]);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingMissingTariffs, setLoadingMissingTariffs] = useState(true);

  // Fetch initial data: clients and service points
  useEffect(() => {
    const loadInitialData = async () => {
      setLoadingSummary(true);
      setLoadingMissingTariffs(true);
      try {
        const fetchedClients = await fetchClienti();
        setClientsList(fetchedClients);

        const fetchedPuntiServizio = await fetchPuntiServizio();
        const psMap = new Map<string, PuntoServizio>();
        fetchedPuntiServizio.forEach(ps => psMap.set(ps.id, ps));
        setPuntiServizioMap(psMap);

        if (fetchedClients.length > 0) {
          setSelectedClientId(fetchedClients[0].id);
        } else {
          setSelectedClientId(null);
        }
      } catch (err) {
        showError("Errore nel caricamento dei dati iniziali.");
        console.error("Error loading initial data:", err);
      } finally {
        setLoadingSummary(false);
        setLoadingMissingTariffs(false);
      }
    };
    loadInitialData();
  }, []);

  // Fetch and process service data for summary based on selected client
  const fetchAndProcessServiceData = useCallback(async () => {
    setLoadingSummary(true);
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
      setLoadingSummary(false);
    }
  }, [selectedClientId, puntiServizioMap]);

  // Fetch and identify missing tariffs
  const fetchAndIdentifyMissingTariffs = useCallback(async () => {
    setLoadingMissingTariffs(true);
    try {
      const allServices = await fetchServiceRequestsForAnalysis(); // Fetch all services
      const allTariffe = await fetchAllTariffe();
      const allClients = await fetchClienti(); // Re-fetch clients for names
      const allPuntiServizio = await fetchPuntiServizio(); // Re-fetch service points for names

      const clientNameMap = new Map(allClients.map(c => [c.id, c.nome_cliente]));
      const servicePointNameMap = new Map(allPuntiServizio.map(ps => [ps.id, ps.nome_punto_servizio]));

      const identifiedMissingTariffs: MissingTariffEntry[] = [];

      for (const service of allServices) {
        const serviceStartDate = parseISO(service.start_date);
        const serviceClientId = service.client_id;
        const servicePointId = service.service_point_id;
        const serviceType = service.type;

        let tariffFound = false;

        // Prioritize tariffs specific to a service point
        if (servicePointId) {
          const matchingTariffsForPoint = allTariffe.filter(tariff =>
            tariff.client_id === serviceClientId &&
            tariff.service_type === serviceType &&
            tariff.punto_servizio_id === servicePointId &&
            isWithinInterval(serviceStartDate, {
              start: parseISO(tariff.data_inizio_validita),
              end: tariff.data_fine_validita ? parseISO(tariff.data_fine_validita) : new Date(), // If no end date, assume ongoing
            })
          );
          if (matchingTariffsForPoint.length > 0) {
            tariffFound = true;
          }
        }

        // If no specific service point tariff found, check for general client tariffs
        if (!tariffFound) {
          const matchingGeneralTariffs = allTariffe.filter(tariff =>
            tariff.client_id === serviceClientId &&
            tariff.service_type === serviceType &&
            tariff.punto_servizio_id === null && // General tariff for the client
            isWithinInterval(serviceStartDate, {
              start: parseISO(tariff.data_inizio_validita),
              end: tariff.data_fine_validita ? parseISO(tariff.data_fine_validita) : new Date(),
            })
          );
          if (matchingGeneralTariffs.length > 0) {
            tariffFound = true;
          }
        }

        if (!tariffFound) {
          identifiedMissingTariffs.push({
            serviceId: service.id,
            serviceType: serviceType,
            clientName: clientNameMap.get(serviceClientId) || 'Cliente Sconosciuto',
            servicePointName: servicePointNameMap.get(servicePointId) || 'Punto Servizio Sconosciuto',
            startDate: format(serviceStartDate, 'PPP', { locale: it }),
            reason: "Nessuna tariffa corrispondente trovata per il periodo e il tipo di servizio.",
          });
        }
      }
      setMissingTariffs(identifiedMissingTariffs);
    } catch (err) {
      showError("Errore nel recupero o nell'identificazione delle tariffe mancanti.");
      console.error("Error fetching or identifying missing tariffs:", err);
      setMissingTariffs([]);
    } finally {
      setLoadingMissingTariffs(false);
    }
  }, [puntiServizioMap]); // Depend on puntiServizioMap for names

  useEffect(() => {
    if (puntiServizioMap.size > 0 || clientsList.length > 0) {
      fetchAndProcessServiceData();
      fetchAndIdentifyMissingTariffs();
    }
  }, [selectedClientId, puntiServizioMap, clientsList, fetchAndProcessServiceData, fetchAndIdentifyMissingTariffs]);

  const summaryColumns: ColumnDef<ServiceSummary>[] = useMemo(() => [
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

  const missingTariffsColumns: ColumnDef<MissingTariffEntry>[] = useMemo(() => [
    {
      accessorKey: "serviceId",
      header: "ID Servizio",
    },
    {
      accessorKey: "serviceType",
      header: "Tipo Servizio",
    },
    {
      accessorKey: "clientName",
      header: "Cliente",
    },
    {
      accessorKey: "servicePointName",
      header: "Punto Servizio",
    },
    {
      accessorKey: "startDate",
      header: "Data Inizio Servizio",
    },
    {
      accessorKey: "reason",
      header: "Motivo",
    },
  ], []);

  const summaryTable = useReactTable({
    data: summaryData,
    columns: summaryColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  const missingTariffsTable = useReactTable({
    data: missingTariffs,
    columns: missingTariffsColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="container mx-auto p-4">
      <Card className="w-full max-w-6xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">Analisi Contabile</CardTitle>
          <CardDescription className="text-center">
            Strumenti per l'analisi dei costi e la verifica delle tariffe.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="sintesi-contabile">Sintesi Contabile</TabsTrigger>
              <TabsTrigger value="tariffe-mancanti">Verifica Tariffe Mancanti</TabsTrigger>
            </TabsList>

            <TabsContent value="sintesi-contabile" className="mt-4">
              <div className="flex flex-col md:flex-row gap-4 items-center mb-4">
                <div className="w-full md:w-1/2">
                  <Label htmlFor="client-select">Seleziona Cliente</Label>
                  <Select
                    onValueChange={(value) => setSelectedClientId(value === "all" ? null : value)}
                    value={selectedClientId || "all"}
                    disabled={loadingSummary}
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
                <Button onClick={fetchAndProcessServiceData} disabled={loadingSummary} className="mt-auto">
                  <RefreshCcw className="mr-2 h-4 w-4" /> {loadingSummary ? 'Caricamento...' : 'Aggiorna Dati'}
                </Button>
              </div>

              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    {summaryTable.getHeaderGroups().map((headerGroup) => (
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
                    {loadingSummary ? (
                      <TableRow>
                        <TableCell colSpan={summaryColumns.length} className="h-24 text-center">
                          Caricamento dati di analisi...
                        </TableCell>
                      </TableRow>
                    ) : (summaryTable && summaryTable.getRowModel().rows?.length) ? (
                      summaryTable.getRowModel().rows.map((row) => (
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
                        <TableCell colSpan={summaryColumns.length} className="h-24 text-center">
                          Nessun dato di servizio trovato per i criteri selezionati.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="tariffe-mancanti" className="mt-4">
              <div className="flex justify-end mb-4">
                <Button onClick={fetchAndIdentifyMissingTariffs} disabled={loadingMissingTariffs}>
                  <RefreshCcw className="mr-2 h-4 w-4" /> {loadingMissingTariffs ? 'Caricamento...' : 'Aggiorna Tariffe Mancanti'}
                </Button>
              </div>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    {missingTariffsTable.getHeaderGroups().map((headerGroup) => (
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
                    {loadingMissingTariffs ? (
                      <TableRow>
                        <TableCell colSpan={missingTariffsColumns.length} className="h-24 text-center">
                          Caricamento tariffe mancanti...
                        </TableCell>
                      </TableRow>
                    ) : (missingTariffsTable && missingTariffsTable.getRowModel().rows?.length) ? (
                      missingTariffsTable.getRowModel().rows.map((row) => (
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
                        <TableCell colSpan={missingTariffsColumns.length} className="h-24 text-center">
                          Nessuna tariffa mancante trovata.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalisiContabile;