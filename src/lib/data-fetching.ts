import { supabase } from "@/integrations/supabase/client";
import { Cliente, Fornitore } from "@/lib/anagrafiche-data";
import { showError } from "@/utils/toast";

export async function fetchClienti(): Promise<Cliente[]> {
  const { data, error } = await supabase
    .from('clienti')
    .select('id, nome_cliente');

  if (error) {
    showError(`Errore nel recupero dei clienti: ${error.message}`);
    console.error("Error fetching clienti:", error);
    return [];
  }
  return data || [];
}

export async function fetchFornitori(): Promise<Fornitore[]> {
  const { data, error } = await supabase
    .from('fornitori')
    .select('id, nome_fornitore');

  if (error) {
    showError(`Errore nel recupero dei fornitori: ${error.message}`);
    console.error("Error fetching fornitori:", error);
    return [];
  }
  return data || [];
}