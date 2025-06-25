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