// src/lib/data-fetching.ts
// ...
export async function fetchOperatoriNetwork(): Promise<OperatoreNetwork[]> {
  const { data, error } = await supabase
    .from('operatori_network')
    .select('id, nome, cognome, telefono, email, client_id, created_at'); // Add created_at here

  if (error) {
    console.error("Error fetching operatori network:", error);
    return [];
  }
  return data as OperatoreNetwork[];
}
// ...