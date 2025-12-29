
import { NextResponse } from 'next/server';
import { calendar, defaultCalendarId } from '@/lib/google-calendar';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { startTime, endTime, name, email, phone, calendarId } = body;
    const targetCalendarId = calendarId || defaultCalendarId;

    if (!startTime || !endTime || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Vérifier si le slot est toujours libre (Double check)
    // (Simplification: On tente l'insertion, Google gère pas les collisions par défaut, donc idéalement faudrait revérifier)
    
    // Créer l'événement
    const event = {
      summary: `Coiffure - ${name}`,
      description: `Client: ${name}\nEmail: ${email}\nTel: ${phone}`,
      start: {
        dateTime: startTime, // ISO format expects timezone offset or Z
      },
      end: {
        dateTime: endTime,
      },
      attendees: [
        { email: email } // Invite le client
      ],
    };

    const insertResponse = await calendar.events.insert({
      calendarId: targetCalendarId,
      requestBody: event,
    });

    return NextResponse.json({ 
        success: true, 
        eventId: insertResponse.data.id,
        link: insertResponse.data.htmlLink
    });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
