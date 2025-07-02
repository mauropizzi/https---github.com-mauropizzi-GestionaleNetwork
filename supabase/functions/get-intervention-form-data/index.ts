import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the service role key
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Fetch all necessary data in parallel
    const [
      puntiServizioRes,
      personaleRes,
      operatoriNetworkRes
    ] = await Promise.all([
      supabaseClient.from('punti_servizio').select('id, nome_punto_servizio, tempo_intervento, id_cliente, fornitore_id, codice_sicep, codice_cliente'),
      supabaseClient.from('personale').select('id, nome, cognome, ruolo, telefono'),
      supabaseClient.from('operatori_network').select('id, nome, cognome, client_id')
    ]);

    if (puntiServizioRes.error) throw puntiServizioRes.error;
    if (personaleRes.error) throw personaleRes.error;
    if (operatoriNetworkRes.error) throw operatoriNetworkRes.error;

    // Filter personnel by role
    const allPersonale = personaleRes.data || [];
    const pattugliaPersonale = allPersonale.filter(p => p.ruolo === 'Pattuglia');
    const coOperatorsPersonnel = allPersonale.filter(p => p.ruolo === 'Operatore C.O.');

    const responseData = {
      puntiServizioList: puntiServizioRes.data,
      pattugliaPersonale: pattugliaPersonale,
      coOperatorsPersonnel: coOperatorsPersonnel,
      operatoriNetworkList: operatoriNetworkRes.data,
    };

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Error in get-intervention-form-data function:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})