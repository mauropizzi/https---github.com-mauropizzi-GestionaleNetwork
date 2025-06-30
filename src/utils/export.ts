import * as XLSX from 'xlsx';
import { showSuccess, showError } from "@/utils/toast";

export const exportTableToExcel = (data: any[], fileName: string, sheetName: string) => {
  if (!data || data.length === 0) {
    showError("Nessun dato da esportare.");
    return;
  }

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${fileName}.xlsx`);
  showSuccess(`Dati esportati in "${fileName}.xlsx" con successo!`);
};

export const exportTemplateToExcel = (headers: string[], fileName: string, sheetName: string) => {
  if (!headers || headers.length === 0) {
    showError("Nessuna intestazione fornita per il template.");
    return;
  }

  const ws = XLSX.utils.aoa_to_sheet([headers]); // Create sheet from array of arrays (just headers)
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${fileName}.xlsx`);
  showSuccess(`Template "${fileName}.xlsx" scaricato con successo!`);
};