// src/components/dotazioni-di-servizio/ServiceReportForm.tsx
// Assuming DotazioniFormValues requires serviceDate: Date;
// In the defaultValues for useForm:
// defaultValues: {
//   serviceDate: new Date(), // Ensure it's always initialized
//   // ... other fields
// },

// When loading existing data (e.g., in a useEffect with form.reset):
// form.reset({
//   ...fetchedReport,
//   serviceDate: fetchedReport.service_date ? new Date(fetchedReport.service_date) : new Date(), // Provide a fallback
// });
// The exact lines 233 and 261 need context, but the fix is to ensure the object passed to `useForm` or `form.reset`
// has `serviceDate` as a non-optional `Date` object.