// src/components/anagrafiche/OperatoriNetworkTable.tsx
// ...
// Assuming 'operatore' is of type 'OperatoreNetwork'
// Change:
// {operatore.nome_cliente}
// To:
{operatore.clienti?.nome_cliente}
// ...