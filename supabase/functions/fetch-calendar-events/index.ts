// Edge Function: fetch-calendar-events
// Fetches events from a public Google Calendar iCal URL and stores them in Supabase
// Triggered via Cron or Webhook

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';
import ICAL from 'https://esm.sh/ical.js@1.5.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CALENDAR_URL = 'https://calendar.google.com/calendar/ical/c_648df9e785e29f211ec640213ba3a539239574b9adfdc67e69c8d5aac6dffbc2%40group.calendar.google.com/public/basic.ics';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('📅 Fetching calendar events...');

    const response = await fetch(CALENDAR_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch calendar: ${response.statusText}`);
    }

    const icsData = await response.text();
    const jcalData = ICAL.parse(icsData);
    const comp = new ICAL.Component(jcalData);
    const vevents = comp.getAllSubcomponents('vevent');

    console.log(`Found ${vevents.length} events.`);

    let upsertedCount = 0;
    const now = new Date();

    for (const vevent of vevents) {
      const event = new ICAL.Event(vevent);
      
      // Skip old events (older than 7 days ago) to keep DB clean, keep future events
      const startDate = event.startDate.toJSDate();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      if (startDate < sevenDaysAgo) continue;

      const uid = event.uid;
      const summary = event.summary;
      const description = event.description;
      const location = event.location;
      const endDate = event.endDate.toJSDate();

      // Simple topic detection (can be improved with AI later)
      // Look for software names in title/description
      const keywords = ['Figma', 'Notion', 'Python', 'Javascript', 'React', 'Supabase', 'Bubble', 'Webflow', 'Make', 'Zapier', 'n8n', 'Flutter', 'Dart', 'HTML', 'CSS', 'SQL', 'Postgres', 'AI', 'IA', 'ChatGPT', 'Midjourney'];
      let detectedTopic = null;
      
      const textToScan = `${summary} ${description || ''}`.toLowerCase();
      for (const keyword of keywords) {
          if (textToScan.includes(keyword.toLowerCase())) {
              detectedTopic = keyword;
              break; // Take the first match for now
          }
      }

      // Extract organizer email
      let organizerEmail = null;
      if (event.organizer) {
          const organizerStr = String(event.organizer);
          if (organizerStr.startsWith('mailto:')) {
              organizerEmail = organizerStr.substring(7);
          } else {
              organizerEmail = organizerStr;
          }
      }

      // Extract attendees
      const attendees: string[] = [];
      // Use the lower-level component to get properties safely
      const attendeeProps = vevent.getAllProperties('attendee');
      for (const prop of attendeeProps) {
          let email = prop.getFirstValue();
          if (typeof email === 'string') {
              if (email.startsWith('mailto:')) {
                  email = email.substring(7);
              }
              attendees.push(email);
          }
      }

      const { error } = await supabase
        .from('planning_cours')
        .upsert({
          google_event_id: uid,
          title: summary,
          description: description,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          location: location,
          detected_topic: detectedTopic,
          organizer_email: organizerEmail,
          attendees: attendees,
          // Only update status if it's new, otherwise keep existing status (e.g. if already enriched)
        }, { onConflict: 'google_event_id' });

      if (error) {
        console.error(`Error upserting event ${summary}:`, error);
      } else {
        upsertedCount++;
      }
    }

    return new Response(
      JSON.stringify({ 
          message: 'Calendar sync completed', 
          total_events_found: vevents.length,
          events_synced: upsertedCount 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('❌ Error fetching calendar:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
