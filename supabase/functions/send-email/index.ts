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

    // --- In un'applicazione reale, qui integreresti un servizio di invio email come SendGrid, Mailgun, ecc. ---
    // Esempio con un placeholder per un servizio di email API:
    // const EMAIL_SERVICE_API_KEY = Deno.env.get('EMAIL_SERVICE_API_KEY'); // Recupera la chiave API dai segreti di Supabase
    // const EMAIL_SENDER_ADDRESS = 'noreply@yourdomain.com'; // Indirizzo email del mittente configurato nel tuo servizio

    // const response = await fetch('https://api.emailservice.com/v3/send', { // Sostituisci con l'endpoint del tuo servizio
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${EMAIL_SERVICE_API_KEY}`,
    //   },
    //   body: JSON.stringify({
    //     from: EMAIL_SENDER_ADDRESS,
    //     to: to,
    //     subject: subject,
    //     text: body, // O 'html' per email formattate
    //   }),
    // });

    // if (!response.ok) {
    //   const errorData = await response.json();
    //   console.error('Error sending email via external service:', errorData);
    //   return new Response(JSON.stringify({ error: 'Failed to send email', details: errorData }), {
    //     status: 500,
    //     headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    //   });
    // }

    console.log(`Simulating email sent to: ${to}, Subject: ${subject}`);
    console.log(`Body: ${body}`);

    return new Response(JSON.stringify({ message: 'Email sent successfully (simulated)' }), {
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