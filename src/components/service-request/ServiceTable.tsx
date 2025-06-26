import React, { useState } from "react";
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
import { Button } from "@/components/ui/button"; // Import Button component
import { showInfo, showSuccess, showError } from "@/utils/toast"; // Import toast utilities
import { format, isValid } from "date-fns"; // Import isValid
import { it } from 'date-fns/locale';
import { Eye, Edit, Trash2 } from "lucide-react"; // Import icons
import { ServiceDetailsDialog } from "./ServiceDetailsDialog"; // Import new dialog
import { ServiceEditDialog } from "./ServiceEditDialog"; // Import new dialog

// Define the structure of a service request
interface ServiceRequest {
  id: string;
  type: string;
  client: string;
  location: string;
  startDate: Date;
  endDate: Date;
  status: "Pending" | "Approved" | "Rejected" | "Completed";
  cost?: number;
}

// Mock data for demonstration
const initialMockData: ServiceRequest[] = [
  {
    id: "SR001",
    type: "Piantonamento",
    client: "Azienda Alpha",
    location: "Palermo - Segmento VIGILANZA",
    startDate: new Date(2024, 7, 1), // August 1, 2024
    endDate: new Date(2024, 7, 31), // August 31, 2024
    status: "Approved",
    cost: 2500,
  },
  {
    id: "SR002",
    type: "Ispezioni",
    client: "Società Beta",
    location: "Catania - Segmento Portierato",
    startDate: new Date(2024, 8, 10), // September 10, 2024
    endDate: new Date(2024, 8, 10), // September 10, 2024
    status: "Pending",
    cost: undefined,
  },
  {
    id: "SR003",
    type: "Bonifiche",
    client: "Gruppo Gamma",
    location: "Agrigento - Segmento Portierato",
    startDate: new Date(2024, 6, 15), // July 15, 2024
    endDate: new Date(2024, 6, 15), // July 15, 2024
    status: "Completed",
    cost: 150,
  },
  {
    id: "SR004",
    type: "Gestione Chiavi",
    client: "Azienda Alpha",
    location: "Messina - Segmento VIGILANZA",
    startDate: new Date(2024, 9, 1), // October 1, 2024
    endDate: new Date(2024, 9, 1), // October 1, 2024
    status: "Rejected",
    cost: undefined,
  },
];

export function ServiceTable() {
  const [data, setData] = useState<ServiceRequest[]>(initialMockData);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceRequest | null>(null);

  const handleView = (service: ServiceRequest) => {
    setSelectedService(service);
    setIsDetailsDialogOpen(true);
  };

  const handleEdit = (service: ServiceRequest) => {
    setSelectedService(service);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = (updatedService: ServiceRequest) => {
    setData(prevData =>
      prevData.map(service =>
        service.id === updatedService.id ? updatedService : service
      )
    );
    console.log("Servizio aggiornato (simulato):", updatedService);
    setIsEditDialogOpen(false);
    setSelectedService(null);
  };

  const handleDelete = (serviceId: string) => {
    if (window.confirm(`Sei sicuro di voler eliminare il servizio ${serviceId}?`)) {
      setData(prevData => prevData.filter(service => service.id !== serviceId));
      showSuccess(`Servizio ${serviceId} eliminato con successo! (simulato)`);
    } else {
      showInfo(`Eliminazione del servizio ${serviceId} annullata.`);
    }
  };

  const columns: ColumnDef<ServiceRequest>[] = [
    {
      accessorKey: "id",
      header: "ID Servizio",
    },
    {
      accessorKey: "type",
      header: "Tipo Servizio",
    },
    {
      accessorKey: "client",
      header: "Cliente",
    },
    {
      accessorKey: "location",
      header: "Località",
    },
    {
      accessorKey: "startDate",
      header: "Data Inizio",
      cell: ({ row }) => {
        const date = row.original.startDate;
        return isValid(date) ? format(date, "PPP", { locale: it }) : "N/A";
      },
    },
    {
      accessorKey: "endDate",
      header: "Data Fine",
      cell: ({ row }) => {
        const date = row.original.endDate;
        return isValid(date) ? format(date, "PPP", { locale: it }) : "N/A";
      },
    },
    {
      accessorKey: "status",
      header: "Stato",
      cell: ({ row }) => {
        const status = row.original.status;
        let statusClass = "";
        switch (status) {
          case "Approved":
            statusClass = "bg-green-100 text-green-800";
            break;
          case "Pending":
            statusClass = "bg-yellow-100 text-yellow-800";
            break;
          case "Rejected":
            statusClass = "bg-red-100 text-red-800";
            break;
          case "Completed":
            statusClass = "bg-blue-100 text-blue-800";
            break;
          default:
            statusClass = "bg-gray-100 text-gray-800";
        }
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClass}`}>
            {status}
          </span>
        );
      },
    },
    {
      accessorKey: "cost",
      header: "Costo Stimato (€)",
      cell: ({ row }) => (row.original.cost !== undefined ? `${row.original.cost.toFixed(2)} €` : "N/A"),
    },
    {
      id: "actions",
      header: "Azioni",
      cell: ({ row }) => (
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleView(row.original)}
            title="Visualizza"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleEdit(row.original)}
            title="Modifica"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleDelete(row.original.id)}
            title="Elimina"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data, // Use the mutable state data
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="rounded-md border">
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
          {table.getRowModel().rows?.length ? (
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
                Nessun risultato.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Service Details Dialog */}
      <ServiceDetailsDialog
        isOpen={isDetailsDialogOpen}
        onClose={() => setIsDetailsDialogOpen(false)}
        service={selectedService}
      />

      {/* Service Edit Dialog */}
      <ServiceEditDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        service={selectedService}
        onSave={handleSaveEdit}
      />
    </div>
  );
}