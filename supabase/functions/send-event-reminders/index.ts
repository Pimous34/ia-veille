import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not set');
    }

    // Calculate target date (Today + 2 days)
    const now = new Date();
    const targetDate = new Date(now);
    targetDate.setDate(now.getDate() + 2);
    targetDate.setHours(0, 0, 0, 0); // Start of the day

    const nextDay = new Date(targetDate);
    nextDay.setDate(targetDate.getDate() + 1); // Start of the next day

    console.log(`Checking events between ${targetDate.toISOString()} and ${nextDay.toISOString()}`);

    // Fetch events for D+2 that haven't had a reminder sent
    const { data: events, error } = await supabase
      .from('planning_cours')
      .select('*')
      .gte('start_date', targetDate.toISOString())
      .lt('start_date', nextDay.toISOString())
      .eq('reminder_sent', false);

    if (error) {
      throw error;
    }

    console.log(`Found ${events?.length || 0} events to remind.`);

    const results = [];

    if (events && events.length > 0) {
      for (const event of events) {
        // Collect recipients
        const recipients = new Set<string>();
        
        // Add organizer
        if (event.organizer_email) recipients.add(event.organizer_email);
        
        // Add attendees
        if (event.attendees && Array.isArray(event.attendees)) {
            event.attendees.forEach((email: string) => recipients.add(email));
        }

        // Add mandatory CC
        recipients.add('acaplier@clearsait.com');

        const to = Array.from(recipients);

        if (to.length === 0) {
            console.log(`No recipients for event ${event.title}, skipping.`);
            continue;
        }

        // Send email via Resend
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: 'Oreegami <oreegami@ia.calm-connexion.com>', 
            to: to,
            subject: `Oreegami : Préparation cours du ${new Date(event.start_date).toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: '2-digit' })}`,
            html: `
              <p>Bonjour,</p>
              <p>Vous allez prochainement avoir un cours avec les apprenants d'Oreegami le ${new Date(event.start_date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}.</p>
              <p>En répondant à ce mail, vous allez pouvoir communiquer avec eux directement à la voix par l'intermédiaire de l'avatar parlant de l'application Oreegam'IA.</p>
              <p>Bonne journée à vous.</p>
            `,
            // Reply-to address that will be intercepted by the webhook
            reply_to: 'reply@ia.calm-connexion.com' 
          }),
        });

        const emailResult = await emailResponse.json();

        if (!emailResponse.ok) {
            console.error(`Failed to send email for event ${event.id}:`, emailResult);
            results.push({ event_id: event.id, status: 'failed', error: emailResult });
        } else {
            console.log(`Email sent for event ${event.id}`);
            
            // Mark as sent
            await supabase
                .from('planning_cours')
                .update({ reminder_sent: true })
                .eq('id', event.id);
                
            results.push({ event_id: event.id, status: 'sent', data: emailResult });
        }
      }
    }

    return new Response(
      JSON.stringify({ message: 'Process completed', results }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error sending reminders:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
