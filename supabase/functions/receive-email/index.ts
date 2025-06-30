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

    // SendGrid sends data as multipart/form-data
    const formData = await req.formData();

    // Extract sender email and name from the 'from' field (e.g., "Name <email@example.com>")
    const senderEmailRaw = formData.get('from')?.toString() || 'unknown@example.com';
    const match = senderEmailRaw.match(/(.*)<(.*)>/);
    const senderName = match ? match[1].trim() : null;
    const senderEmail = match ? match[2].trim() : senderEmailRaw;

    const subject = formData.get('subject')?.toString() || 'No Subject';
    const bodyText = formData.get('text')?.toString() || null;
    const bodyHtml = formData.get('html')?.toString() || null;

    const attachments: { filename: string; contentType: string; size: number }[] = [];
    // SendGrid sends attachments as 'attachment1', 'attachment2', etc.
    // The 'attachments' field in formData is usually a count of attachments.
    const attachmentCount = parseInt(formData.get('attachments')?.toString() || '0', 10);

    for (let i = 1; i <= attachmentCount; i++) {
      const file = formData.get(`attachment${i}`);
      if (file instanceof File) {
        attachments.push({
          filename: file.name,
          contentType: file.type,
          size: file.size,
        });
        // Nota: Per allegati di grandi dimensioni, è consigliabile caricarli su Supabase Storage
        // e salvare solo il loro URL nel database, anziché il contenuto Base64.
        // Per semplicità, qui salviamo solo i metadati.
      }
    }

    const { data, error } = await supabaseClient
      .from('incoming_emails')
      .insert({
        sender_email: senderEmail,
        sender_name: senderName,
        subject: subject,
        body_text: bodyText,
        body_html: bodyHtml,
        attachments: attachments.length > 0 ? attachments : null,
        raw_email: JSON.stringify(Object.fromEntries(formData)), // Store raw payload for debugging
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