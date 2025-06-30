import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
      }
    );

    const payload = await req.json();
    console.log('Received email webhook payload:', payload);

    // This parsing logic might need to be adjusted based on your email provider's webhook format.
    // This example assumes a basic Mailjet Inbound Parse format or similar.
    const senderEmail = payload.From || 'unknown@example.com';
    const senderName = payload.FromName || null;
    const subject = payload.Subject || 'No Subject';
    const bodyText = payload['Text-part'] || null;
    const bodyHtml = payload['Html-part'] || null;
    const attachments = payload.Attachments ? JSON.parse(payload.Attachments) : null; // Mailjet sends attachments as JSON string

    const { data, error } = await supabaseClient
      .from('incoming_emails')
      .insert({
        sender_email: senderEmail,
        sender_name: senderName,
        subject: subject,
        body_text: bodyText,
        body_html: bodyHtml,
        attachments: attachments,
        raw_email: JSON.stringify(payload), // Store raw payload for debugging
      });

    if (error) {
      console.error('Error inserting incoming email:', error);
      return new Response(JSON.stringify({ error: 'Failed to save email', details: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Incoming email saved successfully:', data);
    return new Response(JSON.stringify({ message: 'Email received and saved successfully' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in receive-email function:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});