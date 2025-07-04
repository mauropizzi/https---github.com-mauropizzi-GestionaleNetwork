import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { Cliente, Fornitore, OperatoreNetwork, PuntoServizio, Procedure, ServiziCanone, ServiceRequest, CantiereReport, UserProfile } from '@/lib/anagrafiche-data';

// Define a generic error type for parsing issues
interface ParserError {
  message: string;
  // Add other properties if needed, e.g., line number, column
}

// Helper to check if an object is empty
function isEmpty(obj: object): boolean {
  return Object.keys(obj).length === 0;
}

// Helper to sanitize string values (trim and convert empty strings to null)
function sanitizeString(value: any): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed === '' ? null : trimmed;
  }
  return value === null || value === undefined ? null : String(value).trim() === '' ? null : String(value);
}

// Helper to sanitize boolean values
function sanitizeBoolean(value: any): boolean | null {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const lower = value.toLowerCase().trim();
    if (lower === 'true' || lower === '1' || lower === 'sì' || lower === 'si') return true;
    if (lower === 'false' || lower === '0' || lower === 'no') return false;
  }
  return null; // Or false, depending on default behavior
}

// Helper to sanitize date values
function sanitizeDate(value: any): string | null {
  if (value instanceof Date) {
    return value.toISOString().split('T')[0]; // YYYY-MM-DD
  }
  if (typeof value === 'number') { // Excel date number
    const date = XLSX.SSF.parse_date(value);
    return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
  }
  if (typeof value === 'string') {
    try {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    } catch (e) {
      // Invalid date string
    }
  }
  return null;
}

// Helper to sanitize time values
function sanitizeTime(value: any): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    // Basic regex to check for HH:MM or HH:MM:SS format
    if (/^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/.test(trimmed)) {
      return trimmed;
    }
  }
  // If it's a number from Excel representing time (fraction of a day)
  if (typeof value === 'number' && value >= 0 && value < 1) {
    const totalSeconds = Math.round(value * 24 * 3600);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return null;
}

// Helper to sanitize numeric values
function sanitizeNumber(value: any): number | null {
  if (typeof value === 'number' && !isNaN(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = parseFloat(value.replace(',', '.')); // Handle comma as decimal separator
    if (!isNaN(parsed)) {
      return parsed;
    }
  }
  return null;
}

// Generic function to map Excel row to DB schema
function mapRowToSchema(row: any, tableName: string): any {
  const mapped: any = {};
  for (const key in row) {
    const originalValue = row[key];
    let dbKey = key.toLowerCase().replace(/ /g, '_'); // Convert to snake_case

    // Specific mappings for common fields that might have different names or types
    switch (tableName) {
      case 'clienti':
        if (dbKey === 'nome_cliente') mapped.nome_cliente = sanitizeString(originalValue);
        else if (dbKey === 'partita_iva') mapped.partita_iva = sanitizeString(originalValue);
        else if (dbKey === 'codice_fiscale') mapped.codice_fiscale = sanitizeString(originalValue);
        else if (dbKey === 'email') mapped.email = sanitizeString(originalValue);
        else if (dbKey === 'phone') mapped.phone = sanitizeString(originalValue);
        else if (dbKey === 'address') mapped.address = sanitizeString(originalValue);
        else if (dbKey === 'city') mapped.city = sanitizeString(originalValue);
        else if (dbKey === 'zip_code') mapped.zip_code = sanitizeString(originalValue);
        else if (dbKey === 'province') mapped.province = sanitizeString(originalValue);
        else if (dbKey === 'country') mapped.country = sanitizeString(originalValue);
        else if (dbKey === 'notes') mapped.notes = sanitizeString(originalValue);
        break;
      case 'fornitori':
        if (dbKey === 'nome_fornitore') mapped.nome_fornitore = sanitizeString(originalValue);
        else if (dbKey === 'partita_iva') mapped.partita_iva = sanitizeString(originalValue);
        else if (dbKey === 'codice_fiscale') mapped.codice_fiscale = sanitizeString(originalValue);
        else if (dbKey === 'email') mapped.email = sanitizeString(originalValue);
        else if (dbKey === 'phone') mapped.phone = sanitizeString(originalValue);
        else if (dbKey === 'address') mapped.address = sanitizeString(originalValue);
        else if (dbKey === 'city') mapped.city = sanitizeString(originalValue);
        else if (dbKey === 'zip_code') mapped.zip_code = sanitizeString(originalValue);
        else if (dbKey === 'province') mapped.province = sanitizeString(originalValue);
        else if (dbKey === 'country') mapped.country = sanitizeString(originalValue);
        else if (dbKey === 'service_type') mapped.service_type = sanitizeString(originalValue); // Assuming this is a string type in DB
        else if (dbKey === 'notes') mapped.notes = sanitizeString(originalValue);
        break;
      case 'operatori_network':
        if (dbKey === 'nome') mapped.nome = sanitizeString(originalValue);
        else if (dbKey === 'cognome') mapped.cognome = sanitizeString(originalValue);
        else if (dbKey === 'telefono') mapped.telefono = sanitizeString(originalValue);
        else if (dbKey === 'email') mapped.email = sanitizeString(originalValue);
        else if (dbKey === 'client_id') mapped.client_id = sanitizeString(originalValue); // Assuming client_id is a string UUID
        break;
      case 'punti_servizio':
        if (dbKey === 'nome_punto_servizio') mapped.nome_punto_servizio = sanitizeString(originalValue);
        else if (dbKey === 'address') mapped.address = sanitizeString(originalValue);
        else if (dbKey === 'city') mapped.city = sanitizeString(originalValue);
        else if (dbKey === 'zip_code') mapped.zip_code = sanitizeString(originalValue);
        else if (dbKey === 'province') mapped.province = sanitizeString(originalValue);
        else if (dbKey === 'country') mapped.country = sanitizeString(originalValue);
        else if (dbKey === 'phone') mapped.phone = sanitizeString(originalValue);
        else if (dbKey === 'email') mapped.email = sanitizeString(originalValue);
        else if (dbKey === 'fornitore_id') mapped.fornitore_id = sanitizeString(originalValue); // Assuming fornitore_id is a string UUID
        else if (dbKey === 'client_id') mapped.client_id = sanitizeString(originalValue); // Assuming client_id is a string UUID
        else if (dbKey === 'service_type') mapped.service_type = sanitizeString(originalValue); // Assuming this is a string type in DB
        else if (dbKey === 'notes') mapped.notes = sanitizeString(originalValue);
        else if (dbKey === 'procedure_id') mapped.procedure_id = sanitizeString(originalValue); // Assuming procedure_id is a string UUID
        break;
      case 'procedure':
        if (dbKey === 'nome_procedura') mapped.nome_procedura = sanitizeString(originalValue);
        else if (dbKey === 'description') mapped.description = sanitizeString(originalValue);
        else if (dbKey === 'file_url') mapped.file_url = sanitizeString(originalValue);
        break;
      case 'servizi_canone':
        if (dbKey === 'tipo_canone') mapped.tipo_canone = sanitizeString(originalValue);
        else if (dbKey === 'service_point_id') mapped.service_point_id = sanitizeString(originalValue);
        else if (dbKey === 'fornitore_id') mapped.fornitore_id = sanitizeString(originalValue);
        else if (dbKey === 'client_id') mapped.client_id = sanitizeString(originalValue);
        else if (dbKey === 'start_date') mapped.start_date = sanitizeDate(originalValue);
        else if (dbKey === 'end_date') mapped.end_date = sanitizeDate(originalValue);
        else if (dbKey === 'status') mapped.status = sanitizeString(originalValue);
        else if (dbKey === 'notes') mapped.notes = sanitizeString(originalValue);
        else if (dbKey === 'cost') mapped.cost = sanitizeNumber(originalValue);
        else if (dbKey === 'frequency') mapped.frequency = sanitizeString(originalValue);
        break;
      case 'service_requests':
        if (dbKey === 'type') mapped.type = sanitizeString(originalValue);
        else if (dbKey === 'client_id') mapped.client_id = sanitizeString(originalValue);
        else if (dbKey === 'service_point_id') mapped.service_point_id = sanitizeString(originalValue);
        else if (dbKey === 'fornitore_id') mapped.fornitore_id = sanitizeString(originalValue);
        else if (dbKey === 'start_date') mapped.start_date = sanitizeDate(originalValue);
        else if (dbKey === 'start_time') mapped.start_time = sanitizeTime(originalValue);
        else if (dbKey === 'end_date') mapped.end_date = sanitizeDate(originalValue);
        else if (dbKey === 'end_time') mapped.end_time = sanitizeTime(originalValue);
        else if (dbKey === 'status') mapped.status = sanitizeString(originalValue);
        else if (dbKey === 'notes') mapped.notes = sanitizeString(originalValue);
        else if (dbKey === 'calculated_cost') mapped.calculated_cost = sanitizeNumber(originalValue);
        else if (dbKey === 'multiplier') mapped.multiplier = sanitizeNumber(originalValue);
        break;
      case 'cantiere_reports':
        if (dbKey === 'report_date') mapped.report_date = sanitizeDate(originalValue);
        else if (dbKey === 'report_time') mapped.report_time = sanitizeTime(originalValue);
        else if (dbKey === 'client_id') mapped.client_id = sanitizeString(originalValue);
        else if (dbKey === 'site_name') mapped.site_name = sanitizeString(originalValue);
        else if (dbKey === 'employee_id') mapped.employee_id = sanitizeString(originalValue);
        else if (dbKey === 'service_provided') mapped.service_provided = sanitizeString(originalValue);
        else if (dbKey === 'automezzi_used') mapped.automezzi_used = sanitizeBoolean(originalValue);
        else if (dbKey === 'automezzi_details') mapped.automezzi_details = sanitizeString(originalValue);
        else if (dbKey === 'attrezzi_used') mapped.attrezzi_used = sanitizeBoolean(originalValue);
        else if (dbKey === 'attrezzi_details') mapped.attrezzi_details = sanitizeString(originalValue);
        else if (dbKey === 'notes') mapped.notes = sanitizeString(originalValue);
        break;
      case 'user_profiles':
        if (dbKey === 'user_id') mapped.user_id = sanitizeString(originalValue);
        else if (dbKey === 'username') mapped.username = sanitizeString(originalValue);
        else if (dbKey === 'full_name') mapped.full_name = sanitizeString(originalValue);
        else if (dbKey === 'avatar_url') mapped.avatar_url = sanitizeString(originalValue);
        break;
      default:
        // Fallback for other fields, try to sanitize based on common types
        if (typeof originalValue === 'string') {
          mapped[dbKey] = sanitizeString(originalValue);
        } else if (typeof originalValue === 'number') {
          mapped[dbKey] = sanitizeNumber(originalValue);
        } else if (typeof originalValue === 'boolean') {
          mapped[dbKey] = sanitizeBoolean(originalValue);
        } else {
          mapped[dbKey] = originalValue;
        }
        break;
    }
  }
  return mapped;
}

// Function to validate data based on table schema (simplified)
function validateData(data: any, tableName: string): string[] {
  const errors: string[] = [];
  // Basic validation based on common required fields
  switch (tableName) {
    case 'clienti':
      if (!data.nome_cliente) errors.push('Nome Cliente è richiesto.');
      break;
    case 'fornitori':
      if (!data.nome_fornitore) errors.push('Nome Fornitore è richiesto.');
      break;
    case 'operatori_network':
      if (!data.nome) errors.push('Nome Operatore è richiesto.');
      if (!data.cognome) errors.push('Cognome Operatore è richiesto.');
      break;
    case 'punti_servizio':
      if (!data.nome_punto_servizio) errors.push('Nome Punto Servizio è richiesto.');
      if (!data.client_id) errors.push('ID Cliente è richiesto.');
      break;
    case 'procedure':
      if (!data.nome_procedura) errors.push('Nome Procedura è richiesto.');
      break;
    case 'servizi_canone':
      if (!data.tipo_canone) errors.push('Tipo Canone è richiesto.');
      if (!data.service_point_id) errors.push('ID Punto Servizio è richiesto.');
      if (!data.start_date) errors.push('Data Inizio è richiesta.');
      break;
    case 'service_requests':
      if (!data.type) errors.push('Tipo Richiesta è richiesto.');
      if (!data.client_id) errors.push('ID Cliente è richiesto.');
      if (!data.start_date) errors.push('Data Inizio è richiesta.');
      break;
    case 'cantiere_reports':
      if (!data.report_date) errors.push('Data Report è richiesta.');
      if (!data.site_name) errors.push('Nome Cantiere è richiesto.');
      if (!data.client_id) errors.push('ID Cliente è richiesto.');
      if (!data.employee_id) errors.push('ID Addetto è richiesto.');
      break;
    case 'user_profiles':
      if (!data.user_id) errors.push('ID Utente è richiesto.');
      if (!data.username) errors.push('Username è richiesto.');
      break;
    default:
      break;
  }
  return errors;
}

// Function to get unique constraint columns for a table
function getUniqueConstraintColumns(tableName: string): string[] {
  switch (tableName) {
    case 'clienti':
      return ['nome_cliente']; // Assuming nome_cliente should be unique
    case 'fornitori':
      return ['nome_fornitore']; // Assuming nome_fornitore should be unique
    case 'operatori_network':
      return ['nome', 'cognome']; // Assuming combination of nome and cognome is unique
    case 'punti_servizio':
      return ['nome_punto_servizio', 'client_id']; // Assuming unique per client
    case 'procedure':
      return ['nome_procedura'];
    case 'servizi_canone':
      return ['tipo_canone', 'service_point_id', 'start_date']; // Example unique constraint
    case 'service_requests':
      return ['client_id', 'service_point_id', 'start_date', 'start_time']; // Example unique constraint
    case 'cantiere_reports':
      return ['report_date', 'report_time', 'client_id', 'site_name']; // Example unique constraint
    case 'user_profiles':
      return ['username'];
    default:
      return [];
  }
}

export async function importDataFromExcel(file: File, tableName: string): Promise<{ newRecordsCount: number; updatedRecordsCount: number; invalidRecords: any[]; duplicateRecords: any[]; errors: string[] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json: any[] = XLSX.utils.sheet_to_json(worksheet);

        let newRecordsCount = 0;
        let updatedRecordsCount = 0;
        const invalidRecords: any[] = [];
        const duplicateRecords: any[] = [];
        const importErrors: string[] = [];

        const uniqueColumns = getUniqueConstraintColumns(tableName);

        for (const row of json) {
          // Skip empty rows
          if (isEmpty(row)) {
            continue;
          }

          const mappedData = mapRowToSchema(row, tableName);
          const validationErrors = validateData(mappedData, tableName);

          if (validationErrors.length > 0) {
            invalidRecords.push({ row, errors: validationErrors });
            continue;
          }

          let isDuplicate = false;
          if (uniqueColumns.length > 0) {
            const query = supabase.from(tableName).select('id');
            uniqueColumns.forEach(col => {
              if (mappedData[col]) {
                query.eq(col, mappedData[col]);
              }
            });
            const { data: existingRecords, error: fetchError } = await query;

            if (fetchError) {
              importErrors.push(`Error checking for duplicates for row ${JSON.stringify(row)}: ${fetchError.message}`);
              continue;
            }

            if (existingRecords && existingRecords.length > 0) {
              isDuplicate = true;
              duplicateRecords.push(row);
            }
          }

          if (isDuplicate) {
            // Optionally, update existing records instead of skipping
            // For now, we'll just skip and count as duplicate
            continue;
          }

          // Attempt to insert new record
          const { error: insertError } = await supabase.from(tableName).insert(mappedData);

          if (insertError) {
            importErrors.push(`Error inserting row ${JSON.stringify(row)}: ${insertError.message}`);
          } else {
            newRecordsCount++;
          }
        }

        resolve({ newRecordsCount, updatedRecordsCount, invalidRecords, duplicateRecords, errors: importErrors });

      } catch (error: any) {
        // Access error.message for ParserError
        reject(new Error(`Failed to process Excel file: ${error.message || error}`));
      }
    };

    reader.onerror = (error) => {
      reject(new Error(`File reading error: ${error.type}`));
    };

    reader.readAsArrayBuffer(file);
  });
}