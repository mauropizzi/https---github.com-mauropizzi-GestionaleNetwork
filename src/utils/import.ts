import * as XLSX from 'xlsx';
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess, showInfo } from "@/utils/toast";
import { format } from 'date-fns';

interface ImportResult {
  success: boolean;
  message: string;
  details?: {
    newRecordsCount: number;
    duplicateRecords: any[];
    invalidRecords: any[];
    errors?: string[];
  };
}

// Helper to map form keys to DB keys and define unique identifiers
const tableConfigs: {
  [key: string]: {
    tableName: string;
    requiredFields: string[];
    uniqueFields: string[]; // Fields that together form a unique identifier
    fieldMapping?: { [formKey: string]: string }; // Optional: if form field name differs from DB column name
    typeConversion?: { [dbKey: string]: (value: any) => any }; // Optional: for date, boolean, number conversion
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
    requiredFields: ["nome_punto_servizio", "id_cliente", "indirizzo", "citta"],
    uniqueFields: ["nome_punto_servizio", "id_cliente"],
    fieldMapping: { nomePuntoServizio: "nome_punto_servizio", idCliente: "id_cliente", telefonoReferente: "telefono_referente", tempoIntervento: "tempo_intervento", codiceCliente: "codice_cliente", codiceSicep: "codice_sicep", codiceFatturazione: "codice_fatturazione", fornitoreId: "fornitore_id" },
    typeConversion: {
      tempo_intervento: (val: any) => val ? parseInt(val, 10) : null,
      latitude: (val: any) => val ? parseFloat(val) : null,
      longitude: (val: any) => val ? parseFloat(val) : null,
    },
  },
  "personale": {
    tableName: "personale",
    requiredFields: ["nome", "cognome", "ruolo"],
    uniqueFields: ["codice_fiscale"], // Prefer codice_fiscale if present
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
    requiredFields: ["nome"], // Updated required field
    uniqueFields: ["nome", "cognome"], // Updated unique fields
    fieldMapping: { clienteId: "client_id" }, // New mapping
    // Removed 'referente' and 'tipo_servizio' from mapping as they are dropped
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

        const { tableName, requiredFields, uniqueFields, fieldMapping, typeConversion } = config;

        const { data: existingData, error: fetchError } = await supabase
          .from(tableName)
          .select(uniqueFields.join(','));

        if (fetchError) {
          showError(`Errore nel recupero dei dati esistenti da Supabase: ${fetchError.message}`);
          resolve({ success: false, message: `Errore nel recupero dei dati esistenti: ${fetchError.message}` });
          return;
        }

        const existingUniqueValues = new Set(existingData?.map(row =>
          uniqueFields.map(field => row[field]).join('|')
        ));

        const newRecords: any[] = [];
        const duplicateRecords: any[] = [];
        const invalidRecords: any[] = [];
        const errors: string[] = [];

        importedRows.forEach((row, index) => {
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

          // Check for unique fields
          const uniqueIdentifier = uniqueFields.map(field => processedRow[field]).join('|');
          if (uniqueFields.every(field => processedRow[field]) && existingUniqueValues.has(uniqueIdentifier)) {
            isValidRow = false;
            duplicateRecords.push({ row: index + 2, data: row, reason: `Dato duplicato per: ${uniqueFields.map(f => `${f}: ${processedRow[f]}`)}` });
          }

          if (isValidRow) {
            newRecords.push(processedRow);
          } else {
            invalidRecords.push({ row: index + 2, data: row, errors: rowErrors });
            errors.push(`Riga ${index + 2}: ${rowErrors.join(', ')}`);
          }
        });

        if (newRecords.length > 0) {
          const { error: insertError } = await supabase
            .from(tableName)
            .insert(newRecords);

          if (insertError) {
            showError(`Errore durante l'inserimento dei nuovi record: ${insertError.message}`);
            resolve({ success: false, message: `Errore durante l'inserimento: ${insertError.message}`, details: { newRecordsCount: 0, duplicateRecords, invalidRecords, errors } });
            return;
          }
        }

        let finalMessage = `Importazione completata per ${currentTab}.`;
        if (newRecords.length > 0) {
          finalMessage += ` ${newRecords.length} nuovi record inseriti.`;
        }
        if (duplicateRecords.length > 0) {
          finalMessage += ` ${duplicateRecords.length} record duplicati ignorati.`;
        }
        if (invalidRecords.length > 0) {
          finalMessage += ` ${invalidRecords.length} record non validi ignorati.`;
        }

        if (newRecords.length > 0 && duplicateRecords.length === 0 && invalidRecords.length === 0) {
          showSuccess(finalMessage);
        } else if (newRecords.length > 0 && (duplicateRecords.length > 0 || invalidRecords.length > 0)) {
          showInfo(finalMessage);
        } else if (newRecords.length === 0 && (duplicateRecords.length > 0 || invalidRecords.length > 0)) {
          showError(finalMessage);
        } else {
          showInfo("Nessun record da importare o tutti i record erano duplicati/non validi.");
        }

        resolve({
          success: newRecords.length > 0,
          message: finalMessage,
          details: {
            newRecordsCount: newRecords.length,
            duplicateRecords,
            invalidRecords,
            errors,
          },
        });

      } catch (error: any) {
        showError(`Errore durante la lettura del file: ${error.message}`);
        resolve({ success: false, message: `Errore durante la lettura del file: ${error.message}` });
      }
    };

    reader.readAsArrayBuffer(file);
  });
}