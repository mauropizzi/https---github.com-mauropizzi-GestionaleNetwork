// src/components/service-request/ServiceTable.tsx
// ...
// Assuming line 77 is something like:
// setServiceRequest(prevState => ({ ...prevState, client: someValue }));
// Change to:
setServiceRequest(prevState => ({
  ...prevState,
  clienti: { nome_cliente: someValue } // Or whatever the correct structure is for Cliente
}));
// ...