import { NextResponse } from 'next/server';
import { calendar } from '@/lib/google-calendar';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { summary, ownerEmail } = body;

    if (!summary || !ownerEmail) {
      return NextResponse.json(
        { error: 'Missing summary or ownerEmail' },
        { status: 400 }
      );
    }

    // 1. Create the new calendar
    const calendarResponse = await calendar.calendars.insert({
      requestBody: {
        summary: summary,
        timeZone: 'Europe/Paris', // Default to Paris, could be dynamic
      },
    });

    const newCalendarId = calendarResponse.data.id;

    if (!newCalendarId) {
      throw new Error('Failed to create calendar');
    }

    // 2. Share the calendar with the user (Add ACL)
    await calendar.acl.insert({
      calendarId: newCalendarId,
      requestBody: {
        role: 'owner', // Give them full control
        scope: {
          type: 'user',
          value: ownerEmail,
        },
      },
    });

    return NextResponse.json({ calendarId: newCalendarId });
  } catch (error: any) {
    console.error('Error creating calendar:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}
