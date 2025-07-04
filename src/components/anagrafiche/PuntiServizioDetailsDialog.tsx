// src/components/anagrafiche/PuntiServizioDetailsDialog.tsx
// ...
// Change:
// {puntoServizio.nome_cliente}
// To:
{puntoServizio.clienti?.nome_cliente}

// Change:
// {puntoServizio.nome_fornitore}
// To:
{puntoServizio.fornitori?.nome_fornitore}

// Change:
// {puntoServizio.procedure}
// To:
{puntoServizio.procedure_id}
// ...