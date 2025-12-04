// Edge Function: handle-email-reply
// Handles incoming email webhooks (e.g., from Resend/SendGrid)
// Parses the reply and updates the corresponding event's teacher_notes

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse the incoming webhook payload
    // Note: The structure depends on the email provider (Resend, SendGrid, Mailgun, etc.)
    // This example assumes a generic structure or Resend's structure if available.
    // For Resend, you typically forward emails to a webhook URL.
    
    const payload = await req.json();
    console.log('Received email webhook payload:', JSON.stringify(payload));

    // Extract sender and body
    // Adjust these fields based on your actual email provider's webhook format
    let sender = '';
    let subject = '';
    let textBody = '';

    // Example for Resend/Generic (adjust as needed)
    // If using Resend "Forwarding", the payload might be the raw email or a parsed JSON
    if (payload.from) sender = payload.from;
    if (payload.subject) subject = payload.subject;
    if (payload.text) textBody = payload.text;
    
    // Fallback for other providers (e.g. SendGrid)
    if (!sender && payload.envelope) {
        sender = JSON.parse(payload.envelope).from;
    }

    if (!sender || !textBody) {
        throw new Error('Could not parse sender or body from payload');
    }

    // Clean up sender email (remove name if present: "Name <email@example.com>")
    const emailMatch = sender.match(/<([^>]+)>/);
    const cleanEmail = emailMatch ? emailMatch[1] : sender.trim();

    console.log(`Processing reply from: ${cleanEmail}`);

    // Find the relevant event
    // Strategy: Find the next upcoming event where this person is an organizer or attendee
    const now = new Date();
    const { data: events, error } = await supabase
        .from('planning_cours')
        .select('*')
        .gte('start_date', now.toISOString())
        .order('start_date', { ascending: true })
        .limit(5); // Check next 5 events

    if (error) throw error;

    let targetEvent = null;

    if (events) {
        for (const event of events) {
            // Check if sender is organizer
            if (event.organizer_email && event.organizer_email.toLowerCase() === cleanEmail.toLowerCase()) {
                targetEvent = event;
                break;
            }
            // Check if sender is attendee
            if (event.attendees && Array.isArray(event.attendees)) {
                if (event.attendees.map((e: string) => e.toLowerCase()).includes(cleanEmail.toLowerCase())) {
                    targetEvent = event;
                    break;
                }
            }
        }
    }

    if (!targetEvent) {
        console.log(`No matching upcoming event found for sender ${cleanEmail}`);
        return new Response(JSON.stringify({ message: 'No matching event found' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });
    }

    console.log(`Found matching event: ${targetEvent.title} (${targetEvent.id})`);

    // Update the event with the notes
    // Append to existing notes if any
    const newNotes = targetEvent.teacher_notes 
        ? `${targetEvent.teacher_notes}\n\n--- Reply from ${cleanEmail} ---\n${textBody}`
        : textBody;

    const { error: updateError } = await supabase
        .from('planning_cours')
        .update({ teacher_notes: newNotes })
        .eq('id', targetEvent.id);

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({ message: 'Event updated successfully', event_id: targetEvent.id }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error processing email reply:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
