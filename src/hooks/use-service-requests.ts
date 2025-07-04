// src/hooks/use-service-requests.ts
// ...
// When mapping fetched data to ServiceRequest:
// Ensure that `clienti`, `fornitori`, `punti_servizio` are treated as single objects.
// Example:
// const mappedData = data.map(item => ({
//   ...item,
//   clienti: item.clienti, // This should now be correctly typed as Cliente
//   punti_servizio: item.punti_servizio, // This should now be correctly typed as PuntoServizio
//   fornitori: item.fornitori, // This should now be correctly typed as Fornitore
// }));
// setServiceRequests(mappedData);

// For error 117: Property 'nome_cliente' does not exist on type '{ nome_cliente: any; }[]'.
// This likely occurs when trying to access `punti_servizio.clienti.nome_cliente`
// If `punti_servizio` is an array, it should be `punti_servizio[0]?.clienti?.nome_cliente`
// But if `punti_servizio` is a single object (as per the updated type), it's `punti_servizio.clienti?.nome_cliente`.
// Given the type updates, it should be `punti_servizio.clienti?.nome_cliente`.
// Example of fix for line 117:
// Change:
// someArray.map(item => item.nome_cliente)
// To:
// someArray.map(item => item.clienti?.nome_cliente) // Assuming item is PuntoServizio or similar
// The exact line 117 needs context, but the fix is to access `clienti.nome_cliente` on the `PuntoServizio` object.