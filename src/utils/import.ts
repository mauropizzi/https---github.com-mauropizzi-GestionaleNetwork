import * as XLSX from 'xlsx';
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess, showInfo } from "@/utils/toast";
import { format } from 'date-fns';
import { fetchProcedure } from "@/lib/data-fetching"; // Import fetchProcedure

interface ImportResult {
  success: boolean;
  message: string;
  details?: {
    newRecordsCount: number;
    updatedRecordsCount: number;
    invalidRecords: any[];
    errors?: string[];
  };
}

// Helper to map form keys to DB keys and define unique identifiers
const tableConfigs: {
  [key: string]: {
    tableName: string;
    requiredFields: string[];
    uniqueFields: string[]; // Fields that together form a unique identifier for upsert
    fieldMapping?: { [formKey: string]: string }; // Optional: if form field name differs from DB column name
    typeConversion?: { [dbKey: string]: (value: any) => any }; // Optional: for date, boolean, number conversion
    preProcess?: (row: any, context: any) => Promise<any>; // New: for async lookups like procedure_id
  };
} = {
  "clienti": {
    tableName: "clienti",
    requiredFields: ["nome_cliente"],
    uniqueFields: ["nome_cliente"],
    fieldMapping: { ragione_sociale: "nome_cliente" },
    typeConversion: { attivo: (val: any) => val === true || val === "true" || val === "SI" || val === "si" },
  },
  "punti-servizio": {
    tableName: "punti_servizio",
    requiredFields: ["nome_punto_servizio", "indirizzo", "citta"],
    uniqueFields: ["nome_punto_servizio"],
    fieldMapping: { nomePuntoServizio: "nome_punto_servizio", idCliente: "id_cliente", telefonoReferente: "telefono_referente", tempoIntervento: "tempo_intervento", codiceCliente: "codice_cliente", codiceSicep: "codice_sicep", codiceFatturazione: "codice_fatturazione", fornitoreId: "fornitore_id", procedureId: "procedure_id" }, // Aggiunto procedureId
    typeConversion: {
      tempo_intervento: (val: any) => val ? parseInt(val, 10) : null,
      latitude: (val: any) => val ? parseFloat(val) : null,
      longitude: (val: any) => val ? parseFloat(val) : null,
    },
    preProcess: async (row: any, context: { procedureMap: Map<string, string> }) => {
      if (row.nomeProcedura && context.procedureMap) { // Assuming 'nomeProcedura' is the column in Excel
        const procedureId = context.procedureMap.get(row.nomeProcedura);
        if (procedureId) {
          row.procedureId = procedureId; // Map the name to the ID
        } else {
          // Handle case where procedure name is not found (e.g., log error, set to null)
          console.warn(`Procedura '${row.nomeProcedura}' non trovata per il punto servizio.`);
          row.procedureId = null;
        }
      }
      return row;
    },
  },
  "personale": {
    tableName: "personale",
    requiredFields: ["nome", "cognome", "ruolo"],
    uniqueFields: ["nome", "cognome", "codice_fiscale"], // Added codice_fiscale for better uniqueness
    fieldMapping: { codiceFiscale: "codice_fiscale", data_nascita: "data_nascita", data_assunzione: "data_assunzione", data_cessazione: "data_cessazione" },
    typeConversion: {
      data_nascita: (val: any) => val ? format(new Date(val), 'yyyy-MM-dd') : null,
      data_assunzione: (val: any) => val ? format(new Date(val), 'yyyy-MM-dd') : null,
      data_cessazione: (val: any) => val ? format(new Date(val), 'yyyy-MM-dd') : null,
      attivo: (val: any) => val === true || val === "true" || val === "SI" || val === "si",
    },
  },
  "operatori-network": {
    tableName: "operatori_network",
    requiredFields: ["nome"],
    uniqueFields: ["nome", "cognome", "email"], // Added cognome and email for better uniqueness
    fieldMapping: { clienteId: "client_id" },
  },
  "fornitori": {
    tableName: "fornitori",
    requiredFields: ["nome_fornitore"],
    uniqueFields: ["nome_fornitore"],
    fieldMapping: { ragione_sociale: "nome_fornitore", tipo_servizio: "tipo_fornitura" },
    typeConversion: { attivo: (val: any) => val === true || val === "true" || val === "SI" || val === "si" },
  },
  "tariffe": {
    tableName: "tariffe",
    requiredFields: ["client_id", "service_type", "client_rate", "supplier_rate", "unita_misura"],
    uniqueFields: ["client_id", "service_type", "unita_misura"],
    fieldMapping: { importo: "client_rate" },
    typeConversion: {
      client_rate: (val: any) => val ? parseFloat(val) : null,
      supplier_rate: (val: any) => val ? parseFloat(val) : null,
      data_inizio_validita: (val: any) => val ? format(new Date(val), 'yyyy-MM-dd') : null,
      data_fine_validita: (val: any) => val ? format(new Date(val), 'yyyy-MM-dd') : null,
    },
  },
  "procedure": {
    tableName: "procedure",
    requiredFields: ["nome_procedura"],
    uniqueFields: ["nome_procedura", "versione"], // Assuming name and version make a procedure unique
    fieldMapping: { data_ultima_revisione: "data_ultima_revisione", documento_url: "documento_url" },
    typeConversion: {
      data_ultima_revisione: (val: any) => val ? format(new Date(val), 'yyyy-MM-dd') : null,
      attivo: (val: any) => val === true || val === "true" || val === "SI" || val === "si",
    },
  },
};

export async function importDataFromExcel(file: File, currentTab: string): Promise<ImportResult> {
  const config = tableConfigs[currentTab];
  if (!config) {
    return { success: false, message: `Configurazione di importazione non trovata per la scheda: ${currentTab}` };
  }

  const reader = new FileReader();
  return new Promise((resolve) => {
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const importedRows: any[] = XLSX.utils.sheet_to_json(worksheet);

        if (importedRows.length === 0) {
          resolve({ success: false, message: "Il file Excel/CSV è vuoto o non contiene dati validi." });
          return;
        }

        const { tableName, requiredFields, uniqueFields, fieldMapping, typeConversion, preProcess } = config;

        // Context for preProcess, e.g., for lookups
        const context: { procedureMap?: Map<string, string> } = {};
        if (currentTab === "punti-servizio") {
          const procedures = await fetchProcedure();
          context.procedureMap = new Map(procedures.map(p => [p.nome_procedura, p.id]));
        }

        // Process rows with preProcess if defined
        const preProcessedRows = preProcess ? await Promise.all(importedRows.map(row => preProcess(row, context))) : importedRows;

        // Fetch existing data to identify records for update
        const { data: existingData, error: fetchError } = await supabase
          .from(tableName)
          .select(`id, ${uniqueFields.join(',')}`); // Select ID and unique fields

        if (fetchError) {
          // Removed direct toast, will be handled by dialog
          resolve({ success: false, message: `Errore nel recupero dei dati esistenti: ${fetchError.message}`, details: { newRecordsCount: 0, updatedRecordsCount: 0, invalidRecords: [], errors: [`Errore nel recupero dei dati esistenti: ${fetchError.message}`] } });
          return;
        }

        const existingRecordsMap = new Map<string, string>(); // Map: uniqueKey -> id
        existingData?.forEach(row => {
          const uniqueKey = uniqueFields.map(field => row[field]).join('|');
          if (uniqueFields.every(field => row[field] !== null && row[field] !== undefined)) { // Only map if all unique fields are present
            existingRecordsMap.set(uniqueKey, row.id);
          }
        });

        const recordsToUpsert: any[] = [];
        const invalidRecords: any[] = [];
        const errors: string[] = [];

        preProcessedRows.forEach((row, index) => {
          const processedRow: any = {};
          let isValidRow = true;
          let rowErrors: string[] = [];

          // Apply field mapping and type conversion
          for (const key in row) {
            const dbKey = fieldMapping?.[key] || key;
            let value = row[key];

            // Apply type conversion
            if (typeConversion && typeConversion[dbKey]) {
              value = typeConversion[dbKey](value);
            }
            processedRow[dbKey] = value;
          }

          // Check for required fields
          requiredFields.forEach(field => {
            if (!processedRow[field] && processedRow[field] !== false && processedRow[field] !== 0) { // Allow 0 and false
              isValidRow = false;
              rowErrors.push(`Campo obbligatorio mancante: '${field}'`);
            }
          });

          if (isValidRow) {
            const uniqueIdentifier = uniqueFields.map(field => processedRow[field]).join('|');
            const existingId = existingRecordsMap.get(uniqueIdentifier);

            if (existingId) {
              // Record exists, add ID for update
              recordsToUpsert.push({ ...processedRow, id: existingId });
            } else {
              // New record, no ID needed for insert
              recordsToUpsert.push(processedRow);
            }
          } else {
            invalidRecords.push({ row: index + 2, data: row, errors: rowErrors });
            errors.push(`Riga ${index + 2}: ${rowErrors.join(', ')}`);
          }
        });

        let newRecordsCount = 0;
        let updatedRecordsCount = 0;

        if (recordsToUpsert.length > 0) {
          const { data: upsertedData, error: upsertError } = await supabase
            .from(tableName)
            .upsert(recordsToUpsert, { onConflict: uniqueFields.join(',') }) // Use uniqueFields for conflict resolution
            .select('id'); // Select ID to count new vs updated

          if (upsertError) {
            // Removed direct toast, will be handled by dialog
            resolve({ success: false, message: `Errore durante l'inserimento/aggiornamento: ${upsertError.message}`, details: { newRecordsCount: 0, updatedRecordsCount: 0, invalidRecords, errors: [...errors, `Errore durante l'inserimento/aggiornamento: ${upsertError.message}`] } });
            return;
          }

          // Count new vs updated records
          upsertedData?.forEach(upsertedRow => {
            const uniqueKey = uniqueFields.map(field => upsertedRow[field]).join('|');
            if (existingRecordsMap.has(uniqueKey)) {
              updatedRecordsCount++;
            } else {
              newRecordsCount++;
            }
          });
        }

        let finalMessage = `Importazione completata per ${currentTab}.`;
        if (newRecordsCount > 0) {
          finalMessage += ` ${newRecordsCount} nuovi record inseriti.`;
        }
        if (updatedRecordsCount > 0) {
          finalMessage += ` ${updatedRecordsCount} record aggiornati.`;
        }
        if (invalidRecords.length > 0) {
          finalMessage += ` ${invalidRecords.length} record non validi ignorati.`;
        }

        // Removed direct toasts, now relying on the dialog
        resolve({
          success: newRecordsCount > 0 || updatedRecordsCount > 0,
          message: finalMessage,
          details: {
            newRecordsCount,
            updatedRecordsCount,
            invalidRecords,
            errors,
          },
        });

      } catch (error: any) {
        // Removed direct toast, will be handled by dialog
        resolve({ success: false, message: `Errore durante la lettura del file: ${error.message}`, details: { newRecordsCount: 0, updatedRecordsCount: 0, invalidRecords: [], errors: [`Errore durante la lettura del file: ${error.message}`] } });
      }
    };

    reader.readAsArrayBuffer(file);
  });
}