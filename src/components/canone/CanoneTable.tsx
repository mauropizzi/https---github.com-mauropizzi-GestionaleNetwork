// src/components/canone/CanoneTable.tsx
// ...
// Assuming 'canone' is of type 'Canone'
// Change:
// {canone.nome_punto_servizio}
// To:
{canone.punti_servizio?.nome_punto_servizio}

// Change:
// {canone.nome_fornitore}
// To:
{canone.fornitori?.nome_fornitore}

// Change:
// {canone.nome_cliente}
// To:
{canone.clienti?.nome_cliente}
// ...