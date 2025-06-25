import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, subject, body } = await req.json();

    if (!to || !subject || !body) {
      return new Response(JSON.stringify({ error: 'Missing required fields: to, subject, body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Recupera la chiave API di Brevo dai segreti di Supabase
    const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY');
    // Imposta l'indirizzo email del mittente. ASSICURATI CHE QUESTO INDIRIZZO SIA VERIFICATO SU BREVO!
    const SENDER_EMAIL = 'noreply@yourdomain.com'; // <-- CAMBIA QUESTO CON UN TUO INDIRIZZO VERIFICATO SU BREVO

    if (!BREVO_API_KEY) {
      return new Response(JSON.stringify({ error: 'Brevo API Key not configured in Supabase secrets.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: { email: SENDER_EMAIL, name: "Security App" }, // Puoi cambiare il nome del mittente
        to: [{ email: to }],
        subject: subject,
        textContent: body, // Usiamo textContent perché il body attuale è testo semplice
      }),
    });

    if (!brevoResponse.ok) {
      const errorData = await brevoResponse.json();
      console.error('Error sending email via Brevo:', errorData);
      return new Response(JSON.stringify({ error: 'Failed to send email via Brevo', details: errorData }), {
        status: brevoResponse.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const successData = await brevoResponse.json();
    console.log('Email sent successfully via Brevo:', successData);
    return new Response(JSON.stringify({ message: 'Email sent successfully via Brevo', brevoResponse: successData }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in send-email function:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});