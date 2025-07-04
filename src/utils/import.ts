import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { Cliente, Fornitore, OperatoreNetwork, PuntoServizio, Procedure, ServiziCanone, ServiziRichiesti, RegistroDiCantiere, Personale, RichiestaManutenzione, UserProfile } from '@/lib/anagrafiche-data';

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
    const lowerCaseKey = key.toLowerCase().replace(/ /g, '_'); // Convert to snake_case

    // Specific mappings for common fields that might have different names or types
    switch (tableName) {
      case 'clienti':
        if (lowerCaseKey === 'nome_cliente' || lowerCaseKey === 'ragione_sociale') mapped.nome_cliente = sanitizeString(originalValue);
        else if (lowerCaseKey === 'partita_iva') mapped.partita_iva = sanitizeString(originalValue);
        else if (lowerCaseKey === 'codice_fiscale') mapped.codice_fiscale = sanitizeString(originalValue);
        else if (lowerCaseKey === 'email') mapped.email = sanitizeString(originalValue);
        else if (lowerCaseKey === 'phone' || lowerCaseKey === 'telefono') mapped.telefono = sanitizeString(originalValue);
        else if (lowerCaseKey === 'address' || lowerCaseKey === 'indirizzo') mapped.indirizzo = sanitizeString(originalValue);
        else if (lowerCaseKey === 'city' || lowerCaseKey === 'citta') mapped.citta = sanitizeString(originalValue);
        else if (lowerCaseKey === 'zip_code' || lowerCaseKey === 'cap') mapped.cap = sanitizeString(originalValue);
        else if (lowerCaseKey === 'province' || lowerCaseKey === 'provincia') mapped.provincia = sanitizeString(originalValue);
        else if (lowerCaseKey === 'pec') mapped.pec = sanitizeString(originalValue);
        else if (lowerCaseKey === 'sdi') mapped.sdi = sanitizeString(originalValue);
        else if (lowerCaseKey === 'attivo') mapped.attivo = sanitizeBoolean(originalValue);
        else if (lowerCaseKey === 'note') mapped.note = sanitizeString(originalValue);
        break;
      case 'fornitori':
        if (lowerCaseKey === 'nome_fornitore' || lowerCaseKey === 'ragione_sociale') mapped.nome_fornitore = sanitizeString(originalValue);
        else if (lowerCaseKey === 'partita_iva') mapped.partita_iva = sanitizeString(originalValue);
        else if (lowerCaseKey === 'codice_fiscale') mapped.codice_fiscale = sanitizeString(originalValue);
        else if (lowerCaseKey === 'referente') mapped.referente = sanitizeString(originalValue);
        else if (lowerCaseKey === 'phone' || lowerCaseKey === 'telefono') mapped.telefono = sanitizeString(originalValue);
        else if (lowerCaseKey === 'email') mapped.email = sanitizeString(originalValue);
        else if (lowerCaseKey === 'tipo_fornitura' || lowerCaseKey === 'tipo_servizio') mapped.tipo_fornitura = sanitizeString(originalValue);
        else if (lowerCaseKey === 'address' || lowerCaseKey === 'indirizzo') mapped.indirizzo = sanitizeString(originalValue);
        else if (lowerCaseKey === 'zip_code' || lowerCaseKey === 'cap') mapped.cap = sanitizeString(originalValue);
        else if (lowerCaseKey === 'city' || lowerCaseKey === 'citta') mapped.citta = sanitizeString(originalValue);
        else if (lowerCaseKey === 'province' || lowerCaseKey === 'provincia') mapped.provincia = sanitizeString(originalValue);
        else if (lowerCaseKey === 'pec') mapped.pec = sanitizeString(originalValue);
        else if (lowerCaseKey === 'attivo') mapped.attivo = sanitizeBoolean(originalValue);
        else if (lowerCaseKey === 'note') mapped.note = sanitizeString(originalValue);
        break;
      case 'operatori_network':
        if (lowerCaseKey === 'nome') mapped.nome = sanitizeString(originalValue);
        else if (lowerCaseKey === 'cognome') mapped.cognome = sanitizeString(originalValue);
        else if (lowerCaseKey === 'telefono') mapped.telefono = sanitizeString(originalValue);
        else if (lowerCaseKey === 'email') mapped.email = sanitizeString(originalValue);
        else if (lowerCaseKey === 'client_id' || lowerCaseKey === 'clienteid') mapped.client_id = sanitizeString(originalValue);
        break;
      case 'punti_servizio':
        if (lowerCaseKey === 'nome_punto_servizio' || lowerCaseKey === 'nomepuntoservizio') mapped.nome_punto_servizio = sanitizeString(originalValue);
        else if (lowerCaseKey === 'id_cliente' || lowerCaseKey === 'idcliente') mapped.id_cliente = sanitizeString(originalValue);
        else if (lowerCaseKey === 'address' || lowerCaseKey === 'indirizzo') mapped.indirizzo = sanitizeString(originalValue);
        else if (lowerCaseKey === 'city' || lowerCaseKey === 'citta') mapped.citta = sanitizeString(originalValue);
        else if (lowerCaseKey === 'zip_code' || lowerCaseKey === 'cap') mapped.cap = sanitizeString(originalValue);
        else if (lowerCaseKey === 'province' || lowerCaseKey === 'provincia') mapped.provincia = sanitizeString(originalValue);
        else if (lowerCaseKey === 'referente') mapped.referente = sanitizeString(originalValue);
        else if (lowerCaseKey === 'telefono_referente' || lowerCaseKey === 'telefonoreferente') mapped.telefono_referente = sanitizeString(originalValue);
        else if (lowerCaseKey === 'phone' || lowerCaseKey === 'telefono') mapped.telefono = sanitizeString(originalValue);
        else if (lowerCaseKey === 'email') mapped.email = sanitizeString(originalValue);
        else if (lowerCaseKey === 'note') mapped.note = sanitizeString(originalValue);
        else if (lowerCaseKey === 'tempo_intervento' || lowerCaseKey === 'tempointervento') mapped.tempo_intervento = sanitizeNumber(originalValue);
        else if (lowerCaseKey === 'fornitore_id' || lowerCaseKey === 'fornitoreid') mapped.fornitore_id = sanitizeString(originalValue);
        else if (lowerCaseKey === 'codice_cliente' || lowerCaseKey === 'codicecliente') mapped.codice_cliente = sanitizeString(originalValue);
        else if (lowerCaseKey === 'codice_sicep' || lowerCaseKey === 'codicesicep') mapped.codice_sicep = sanitizeString(originalValue);
        else if (lowerCaseKey === 'codice_fatturazione' || lowerCaseKey === 'codicefatturazione') mapped.codice_fatturazione = sanitizeString(originalValue);
        else if (lowerCaseKey === 'latitude') mapped.latitude = sanitizeNumber(originalValue);
        else if (lowerCaseKey === 'longitude') mapped.longitude = sanitizeNumber(originalValue);
        else if (lowerCaseKey === 'procedure_id' || lowerCaseKey === 'nomeprocedura') mapped.procedure_id = sanitizeString(originalValue); // Assuming nomeprocedura maps to procedure_id
        break;
      case 'procedure':
        if (lowerCaseKey === 'nome_procedura') mapped.nome_procedura = sanitizeString(originalValue);
        else if (lowerCaseKey === 'descrizione') mapped.descrizione = sanitizeString(originalValue);
        else if (lowerCaseKey === 'versione') mapped.versione = sanitizeString(originalValue);
        else if (lowerCaseKey === 'data_ultima_revisione') mapped.data_ultima_revisione = sanitizeDate(originalValue);
        else if (lowerCaseKey === 'responsabile') mapped.responsabile = sanitizeString(originalValue);
        else if (lowerCaseKey === 'documento_url') mapped.documento_url = sanitizeString(originalValue);
        else if (lowerCaseKey === 'attivo') mapped.attivo = sanitizeBoolean(originalValue);
        else if (lowerCaseKey === 'note') mapped.note = sanitizeString(originalValue);
        break;
      case 'personale':
        if (lowerCaseKey === 'nome') mapped.nome = sanitizeString(originalValue);
        else if (lowerCaseKey === 'cognome') mapped.cognome = sanitizeString(originalValue);
        else if (lowerCaseKey === 'codice_fiscale' || lowerCaseKey === 'codicefiscale') mapped.codice_fiscale = sanitizeString(originalValue);
        else if (lowerCaseKey === 'ruolo') mapped.ruolo = sanitizeString(originalValue);
        else if (lowerCaseKey === 'telefono') mapped.telefono = sanitizeString(originalValue);
        else if (lowerCaseKey === 'email') mapped.email = sanitizeString(originalValue);
        else if (lowerCaseKey === 'data_nascita') mapped.data_nascita = sanitizeDate(originalValue);
        else if (lowerCaseKey === 'luogo_nascita') mapped.luogo_nascita = sanitizeString(originalValue);
        else if (lowerCaseKey === 'indirizzo') mapped.indirizzo = sanitizeString(originalValue);
        else if (lowerCaseKey === 'cap') mapped.cap = sanitizeString(originalValue);
        else if (lowerCaseKey === 'citta') mapped.citta = sanitizeString(originalValue);
        else if (lowerCaseKey === 'provincia') mapped.provincia = sanitizeString(originalValue);
        else if (lowerCaseKey === 'data_assunzione') mapped.data_assunzione = sanitizeDate(originalValue);
        else if (lowerCaseKey === 'data_cessazione') mapped.data_cessazione = sanitizeDate(originalValue);
        else if (lowerCaseKey === 'attivo') mapped.attivo = sanitizeBoolean(originalValue);
        else if (lowerCaseKey === 'note') mapped.note = sanitizeString(originalValue);
        break;
      case 'tariffe':
        if (lowerCaseKey === 'client_id' || lowerCaseKey === 'cliente_id') mapped.client_id = sanitizeString(originalValue);
        else if (lowerCaseKey === 'service_type' || lowerCaseKey === 'tipo_servizio') mapped.service_type = sanitizeString(originalValue);
        else if (lowerCaseKey === 'client_rate' || lowerCaseKey === 'importo') mapped.client_rate = sanitizeNumber(originalValue);
        else if (lowerCaseKey === 'supplier_rate') mapped.supplier_rate = sanitizeNumber(originalValue);
        else if (lowerCaseKey === 'unita_misura') mapped.unita_misura = sanitizeString(originalValue);
        else if (lowerCaseKey === 'punto_servizio_id') mapped.punto_servizio_id = sanitizeString(originalValue);
        else if (lowerCaseKey === 'fornitore_id') mapped.fornitore_id = sanitizeString(originalValue);
        else if (lowerCaseKey === 'data_inizio_validita') mapped.data_inizio_validita = sanitizeDate(originalValue);
        else if (lowerCaseKey === 'data_fine_validita') mapped.data_fine_validita = sanitizeDate(originalValue);
        else if (lowerCaseKey === 'note') mapped.note = sanitizeString(originalValue);
        break;
      case 'servizi_canone':
        if (lowerCaseKey === 'service_point_id') mapped.service_point_id = sanitizeString(originalValue);
        else if (lowerCaseKey === 'fornitore_id') mapped.fornitore_id = sanitizeString(originalValue);
        else if (lowerCaseKey === 'tipo_canone') mapped.tipo_canone = sanitizeString(originalValue);
        else if (lowerCaseKey === 'start_date') mapped.start_date = sanitizeDate(originalValue);
        else if (lowerCaseKey === 'end_date') mapped.end_date = sanitizeDate(originalValue);
        else if (lowerCaseKey === 'status') mapped.status = sanitizeString(originalValue);
        else if (lowerCaseKey === 'notes') mapped.notes = sanitizeString(originalValue);
        else if (lowerCaseKey === 'calculated_cost') mapped.calculated_cost = sanitizeNumber(originalValue);
        else if (lowerCaseKey === 'client_id') mapped.client_id = sanitizeString(originalValue);
        else if (lowerCaseKey === 'unita_misura') mapped.unita_misura = sanitizeString(originalValue);
        break;
      case 'servizi_richiesti':
        if (lowerCaseKey === 'type') mapped.type = sanitizeString(originalValue);
        else if (lowerCaseKey === 'client_id') mapped.client_id = sanitizeString(originalValue);
        else if (lowerCaseKey === 'service_point_id') mapped.service_point_id = sanitizeString(originalValue);
        else if (lowerCaseKey === 'fornitore_id') mapped.fornitore_id = sanitizeString(originalValue);
        else if (lowerCaseKey === 'start_date') mapped.start_date = sanitizeDate(originalValue);
        else if (lowerCaseKey === 'start_time') mapped.start_time = sanitizeTime(originalValue);
        else if (lowerCaseKey === 'end_date') mapped.end_date = sanitizeDate(originalValue);
        else if (lowerCaseKey === 'end_time') mapped.end_time = sanitizeTime(originalValue);
        else if (lowerCaseKey === 'status') mapped.status = sanitizeString(originalValue);
        else if (lowerCaseKey === 'calculated_cost') mapped.calculated_cost = sanitizeNumber(originalValue);
        else if (lowerCaseKey === 'num_agents') mapped.num_agents = sanitizeNumber(originalValue);
        else if (lowerCaseKey === 'cadence_hours') mapped.cadence_hours = sanitizeNumber(originalValue);
        else if (lowerCaseKey === 'inspection_type') mapped.inspection_type = sanitizeString(originalValue);
        // daily_hours_config is complex, usually not imported via simple excel
        break;
      case 'registri_cantiere':
        if (lowerCaseKey === 'report_date') mapped.report_date = sanitizeDate(originalValue);
        else if (lowerCaseKey === 'report_time') mapped.report_time = sanitizeTime(originalValue);
        else if (lowerCaseKey === 'client_id') mapped.client_id = sanitizeString(originalValue);
        else if (lowerCaseKey === 'site_name') mapped.site_name = sanitizeString(originalValue);
        else if (lowerCaseKey === 'employee_id') mapped.employee_id = sanitizeString(originalValue);
        else if (lowerCaseKey === 'service_provided') mapped.service_provided = sanitizeString(originalValue);
        else if (lowerCaseKey === 'notes') mapped.notes = sanitizeString(originalValue);
        else if (lowerCaseKey === 'start_datetime') mapped.start_datetime = sanitizeDate(originalValue);
        else if (lowerCaseKey === 'end_datetime') mapped.end_datetime = sanitizeDate(originalValue);
        else if (lowerCaseKey === 'status') mapped.status = sanitizeString(originalValue);
        else if (lowerCaseKey === 'addetto_riconsegna_security_service') mapped.addetto_riconsegna_security_service = sanitizeString(originalValue);
        else if (lowerCaseKey === 'responsabile_committente_riconsegna') mapped.responsabile_committente_riconsegna = sanitizeString(originalValue);
        else if (lowerCaseKey === 'esito_servizio') mapped.esito_servizio = sanitizeString(originalValue);
        else if (lowerCaseKey === 'consegne_servizio') mapped.consegne_servizio = sanitizeString(originalValue);
        else if (lowerCaseKey === 'service_point_id') mapped.service_point_id = sanitizeString(originalValue);
        else if (lowerCaseKey === 'latitude') mapped.latitude = sanitizeNumber(originalValue);
        else if (lowerCaseKey === 'longitude') mapped.longitude = sanitizeNumber(originalValue);
        // automezzi_utilizzati and attrezzi_utilizzati are nested, usually not imported via simple excel
        break;
      case 'richieste_manutenzione':
        if (lowerCaseKey === 'report_id') mapped.report_id = sanitizeString(originalValue);
        else if (lowerCaseKey === 'service_point_id') mapped.service_point_id = sanitizeString(originalValue);
        else if (lowerCaseKey === 'vehicle_plate') mapped.vehicle_plate = sanitizeString(originalValue);
        else if (lowerCaseKey === 'issue_description') mapped.issue_description = sanitizeString(originalValue);
        else if (lowerCaseKey === 'status') mapped.status = sanitizeString(originalValue);
        else if (lowerCaseKey === 'priority') mapped.priority = sanitizeString(originalValue);
        else if (lowerCaseKey === 'requested_by_employee_id') mapped.requested_by_employee_id = sanitizeString(originalValue);
        else if (lowerCaseKey === 'requested_at') mapped.requested_at = sanitizeDate(originalValue);
        else if (lowerCaseKey === 'repair_activities') mapped.repair_activities = sanitizeString(originalValue);
        break;
      case 'profiles': // Assuming this is for user profiles
        if (lowerCaseKey === 'id') mapped.id = sanitizeString(originalValue);
        else if (lowerCaseKey === 'first_name') mapped.first_name = sanitizeString(originalValue);
        else if (lowerCaseKey === 'last_name') mapped.last_name = sanitizeString(originalValue);
        else if (lowerCaseKey === 'role') mapped.role = sanitizeString(originalValue);
        break;
      default:
        // Fallback for other fields, try to sanitize based on common types
        if (typeof originalValue === 'string') {
          mapped[lowerCaseKey] = sanitizeString(originalValue);
        } else if (typeof originalValue === 'number') {
          mapped[lowerCaseKey] = sanitizeNumber(originalValue);
        } else if (typeof originalValue === 'boolean') {
          mapped[lowerCaseKey] = sanitizeBoolean(originalValue);
        } else {
          mapped[lowerCaseKey] = originalValue;
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
      if (!data.id_cliente) errors.push('ID Cliente è richiesto.');
      break;
    case 'procedure':
      if (!data.nome_procedura) errors.push('Nome Procedura è richiesto.');
      break;
    case 'servizi_canone':
      if (!data.tipo_canone) errors.push('Tipo Canone è richiesto.');
      if (!data.service_point_id) errors.push('ID Punto Servizio è richiesto.');
      if (!data.start_date) errors.push('Data Inizio è richiesta.');
      break;
    case 'servizi_richiesti':
      if (!data.type) errors.push('Tipo Richiesta è richiesto.');
      if (!data.client_id) errors.push('ID Cliente è richiesto.');
      if (!data.start_date) errors.push('Data Inizio è richiesta.');
      break;
    case 'registri_cantiere':
      if (!data.report_date) errors.push('Data Report è richiesta.');
      if (!data.site_name) errors.push('Nome Cantiere è richiesto.');
      if (!data.client_id) errors.push('ID Cliente è richiesto.');
      if (!data.employee_id) errors.push('ID Addetto è richiesto.');
      break;
    case 'richieste_manutenzione':
      if (!data.vehicle_plate) errors.push('Targa Veicolo è richiesta.');
      if (!data.issue_description) errors.push('Descrizione Problema è richiesta.');
      if (!data.status) errors.push('Stato è richiesto.');
      if (!data.priority) errors.push('Priorità è richiesta.');
      if (!data.requested_at) errors.push('Data Richiesta è richiesta.');
      break;
    case 'profiles':
      if (!data.id) errors.push('ID Utente è richiesto.');
      if (!data.role) errors.push('Ruolo è richiesto.');
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
      return ['nome_punto_servizio', 'id_cliente']; // Assuming unique per client
    case 'procedure':
      return ['nome_procedura'];
    case 'servizi_canone':
      return ['tipo_canone', 'service_point_id', 'start_date']; // Example unique constraint
    case 'servizi_richiesti':
      return ['client_id', 'service_point_id', 'start_date', 'start_time', 'type']; // Example unique constraint
    case 'registri_cantiere':
      return ['report_date', 'report_time', 'client_id', 'site_name']; // Example unique constraint
    case 'richieste_manutenzione':
      return ['vehicle_plate', 'requested_at']; // Assuming unique by plate and request time
    case 'profiles':
      return ['id']; // User ID is unique
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
          let existingRecordId: string | null = null;

          if (uniqueColumns.length > 0) {
            let query = supabase.from(tableName).select('id');
            let hasAllUniqueCols = true;
            uniqueColumns.forEach(col => {
              if (mappedData[col]) {
                query = query.eq(col, mappedData[col]);
              } else {
                hasAllUniqueCols = false; // Cannot check for uniqueness if a unique column is missing
              }
            });

            if (hasAllUniqueCols) {
              const { data: existingRecords, error: fetchError } = await query;

              if (fetchError) {
                importErrors.push(`Error checking for duplicates for row ${JSON.stringify(row)}: ${fetchError.message}`);
                continue;
              }

              if (existingRecords && existingRecords.length > 0) {
                isDuplicate = true;
                existingRecordId = existingRecords[0].id;
                duplicateRecords.push(row); // Still log as duplicate even if updated
              }
            }
          }

          if (isDuplicate && existingRecordId) {
            // Attempt to update existing record
            const { error: updateError } = await supabase.from(tableName).update(mappedData).eq('id', existingRecordId);
            if (updateError) {
              importErrors.push(`Error updating row ${JSON.stringify(row)} (ID: ${existingRecordId}): ${updateError.message}`);
            } else {
              updatedRecordsCount++;
            }
          } else {
            // Attempt to insert new record
            const { error: insertError } = await supabase.from(tableName).insert(mappedData);

            if (insertError) {
              importErrors.push(`Error inserting row ${JSON.stringify(row)}: ${insertError.message}`);
            } else {
              newRecordsCount++;
            }
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