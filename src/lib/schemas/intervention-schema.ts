import { z, ZodIssueCode } from 'zod';
import { format, parseISO, isValid } from 'date-fns';

export const interventionFormSchema = z.object({
  servicePoint: z.string().uuid("Seleziona un punto servizio valido.").nonempty("Il punto servizio è richiesto."),
  requestType: z.string().min(1, "La tipologia di servizio è richiesta."),
  coOperator: z.string().uuid("Seleziona un operatore C.O. valido.").nonempty("L'operatore C.O. è richiesto."),
  requestTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato ora non valido (HH:MM)."),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato ora non valido (HH:MM).").optional().nullable(),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato ora non valido (HH:MM).").optional().nullable(),
  fullAccess: z.enum(['si', 'no'], { required_error: "L'accesso completo è richiesto." }).optional().nullable(),
  vaultAccess: z.enum(['si', 'no'], { required_error: "L'accesso caveau è richiesto." }).optional().nullable(),
  operatorNetworkId: z.string().uuid("Seleziona un operatore network valido.").optional().nullable(),
  gpgIntervention: z.string().uuid("Seleziona un G.P.G. valido.").nonempty("Il G.P.G. intervento è richiesto."),
  anomalies: z.enum(['si', 'no'], { required_error: "Indica se ci sono anomalie." }).optional().nullable(),
  anomalyDescription: z.string().optional().nullable(),
  delay: z.enum(['si', 'no'], { required_error: "Indica se c'è stato un ritardo." }).optional().nullable(),
  delayNotes: z.string().optional().nullable(),
  serviceOutcome: z.string().min(1, "L'esito dell'evento è richiesto.").optional().nullable(),
  barcode: z.string().min(1, "Il barcode è richiesto."),
  startLatitude: z.coerce.number().optional().nullable(),
  startLongitude: z.coerce.number().optional().nullable(),
  endLatitude: z.coerce.number().optional().nullable(),
  endLongitude: z.coerce.number().optional().nullable(),
}).superRefine((data, ctx) => {
  // Conditional validation for final submission
  const isFinalSubmission = data.serviceOutcome !== null && data.serviceOutcome !== undefined && data.serviceOutcome !== '';

  if (isFinalSubmission) {
    if (!data.startTime) {
      ctx.addIssue({
        code: ZodIssueCode.custom,
        message: "L'Orario Inizio Intervento è obbligatorio per la chiusura.",
        path: ['startTime'],
      });
    }
    if (!data.endTime) {
      ctx.addIssue({
        code: ZodIssueCode.custom,
        message: "L'Orario Fine Intervento è obbligatorio per la chiusura.",
        path: ['endTime'],
      });
    }
    if (data.fullAccess === null || data.fullAccess === undefined) {
      ctx.addIssue({
        code: ZodIssueCode.custom,
        message: "Il campo 'Accesso Completo' è obbligatorio per la chiusura.",
        path: ['fullAccess'],
      });
    }
    if (data.vaultAccess === null || data.vaultAccess === undefined) {
      ctx.addIssue({
        code: ZodIssueCode.custom,
        message: "L'accesso caveau è obbligatorio per la chiusura.",
        path: ['vaultAccess'],
      });
    }
    if (!data.operatorNetworkId) {
      ctx.addIssue({
        code: ZodIssueCode.custom,
        message: "Il campo 'Operatore Network' è obbligatorio per la chiusura.",
        path: ['operatorNetworkId'],
      });
    }
    if (data.anomalies === null || data.anomalies === undefined) {
      ctx.addIssue({
        code: ZodIssueCode.custom,
        message: "Il campo 'Anomalie Riscontrate' è obbligatorio per la chiusura.",
        path: ['anomalies'],
      });
    }
    if (data.anomalies === 'si' && (!data.anomalyDescription || data.anomalyDescription.trim() === '')) {
      ctx.addIssue({
        code: ZodIssueCode.custom,
        message: "La 'Descrizione Anomalie' è obbligatoria se sono state riscontrate anomalie.",
        path: ['anomalyDescription'],
      });
    }
    if (data.delay === null || data.delay === undefined) {
      ctx.addIssue({
        code: ZodIssueCode.custom,
        message: "Il campo 'Ritardo' è obbligatorio per la chiusura.",
        path: ['delay'],
      });
    }
    if (data.delay === 'si' && (!data.delayNotes || data.delayNotes.trim() === '')) {
      ctx.addIssue({
        code: ZodIssueCode.custom,
        message: "Il 'Motivo del Ritardo' è obbligatorio se c'è stato un ritardo.",
        path: ['delayNotes'],
      });
    }
    if (data.startLatitude === null || data.startLatitude === undefined || data.startLongitude === null || data.startLongitude === undefined) {
      ctx.addIssue({
        code: ZodIssueCode.custom,
        message: "La 'Posizione GPS presa in carico Richiesta' è obbligatoria per la chiusura.",
        path: ['startLatitude'], // Can point to either lat or lon
      });
    }
    if (data.endLatitude === null || data.endLatitude === undefined || data.endLongitude === null || data.endLongitude === undefined) {
      ctx.addIssue({
        code: ZodIssueCode.custom,
        message: "La 'Posizione GPS Fine Intervento' è obbligatoria per la chiusura.",
        path: ['endLatitude'], // Can point to either lat or lon
      });
    }
  }
});