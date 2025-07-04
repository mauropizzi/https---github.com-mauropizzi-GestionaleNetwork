// src/components/cantiere/CantiereHistoryTable.tsx
// ...
// Assuming 'report' is of type 'CantiereReport'
// Change:
// {report.nome_cliente}
// To:
{report.clienti?.nome_cliente}

// Change:
// {report.nome}
// To:
{report.personale?.nome}

// Change:
// {report.cognome}
// To:
{report.personale?.cognome}
// ...