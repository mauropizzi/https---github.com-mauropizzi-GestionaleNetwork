import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { showInfo, showError } from "@/utils/toast";

export const printTable = (columns: any[], data: any[], title: string) => {
  if (!data || data.length === 0) {
    showError("Nessun dato da stampare.");
    return;
  }

  const doc = new jsPDF();
  doc.text(title, 14, 15);

  const tableColumns = columns.map(col => col.header);
  const tableRows = data.map(row => columns.map(col => {
    // Handle special formatting for dates and numbers if needed
    if (col.accessorKey === 'start_date' || col.accessorKey === 'end_date') {
      return row[col.accessorKey] ? new Date(row[col.accessorKey]).toLocaleDateString('it-IT') : '';
    }
    if (col.accessorKey === 'calculated_cost' && row[col.accessorKey] !== undefined && row[col.accessorKey] !== null) {
      return `${row[col.accessorKey].toFixed(2)} €`;
    }
    return row[col.accessorKey] || '';
  }));

  (doc as any).autoTable({
    head: [tableColumns],
    body: tableRows,
    startY: 20,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [230, 230, 230],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
    },
    columnStyles: {
      // Example: specific width for ID column
      0: { cellWidth: 20 },
    },
  });

  doc.output('dataurlnewwindow'); // Open in new tab
  showInfo("Generazione PDF per la stampa.");
};