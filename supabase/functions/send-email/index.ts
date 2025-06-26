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
    const { to, subject, textBody, htmlBody, attachment } = await req.json();

    if (!to || !subject || (!textBody && !htmlBody)) {
      return new Response(JSON.stringify({ error: 'Missing required fields: to, subject, and either textBody or htmlBody' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const MAILJET_API_KEY = Deno.env.get('MAILJET_API_KEY');
    const MAILJET_SECRET_KEY = Deno.env.get('MAILJET_SECRET_KEY');
    const SENDER_EMAIL = 'mauro.pizzi@lumafinsrl.com';

    if (!MAILJET_API_KEY || !MAILJET_SECRET_KEY) {
      return new Response(JSON.stringify({ error: 'Mailjet API Key or Secret Key not configured in Supabase secrets.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const auth = btoa(`${MAILJET_API_KEY}:${MAILJET_SECRET_KEY}`);

    const mailjetBody: any = {
      Messages: [
        {
          From: {
            Email: SENDER_EMAIL,
            Name: "Security App",
          },
          To: [
            {
              Email: to,
            },
          ],
          Subject: subject,
        },
      ],
    };

    if (htmlBody) {
      mailjetBody.Messages[0].HTMLPart = htmlBody;
    } else {
      mailjetBody.Messages[0].TextPart = textBody;
    }

    if (attachment) {
      mailjetBody.Messages[0].Attachments = [
        {
          ContentType: attachment.contentType,
          Filename: attachment.filename,
          Base64Content: attachment.content,
        },
      ];
    }

    const mailjetResponse = await fetch('https://api.mailjet.com/v3.1/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`,
        ...corsHeaders,
      },
      body: JSON.stringify(mailjetBody),
    });

    if (!mailjetResponse.ok) {
      const errorData = await mailjetResponse.json();
      console.error('Error sending email via Mailjet:', errorData);
      return new Response(JSON.stringify({ error: 'Failed to send email via Mailjet', details: errorData }), {
        status: mailjetResponse.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const successData = await mailjetResponse.json();
    console.log('Email sent successfully via Mailjet:', successData);
    return new Response(JSON.stringify({ message: 'Email sent successfully via Mailjet', mailjetResponse: successData }), {
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