
import { NextResponse } from 'next/server';
import ical from 'node-ical';

const CALENDAR_URL = 'https://calendar.google.com/calendar/ical/c_648df9e785e29f211ec640213ba3a539239574b9adfdc67e69c8d5aac6dffbc2%40group.calendar.google.com/public/basic.ics';

export async function GET() {
  try {
    const data = await ical.async.fromURL(CALENDAR_URL);
    
    // Get target date (Tomorrow)
    const now = new Date();
    const targetDate = new Date(now);
    targetDate.setDate(targetDate.getDate() + 1);
    
    // Reset time for comparison
    const startTarget = new Date(targetDate.setHours(0, 0, 0, 0));
    const endTarget = new Date(targetDate.setHours(23, 59, 59, 999));

    // Filter events for tomorrow
    const events = Object.values(data).filter((event: any) => {
        if (event.type !== 'VEVENT') return false;
        
        const eventStart = new Date(event.start);
        return eventStart >= startTarget && eventStart <= endTarget;
    });

    if (events.length === 0) {
       return NextResponse.json({ found: false, message: 'No events for tomorrow' });
    }

    // Sort by start time if specific time, but these seem to be course days
    const nextEvent: any = events[0]; // Take the first one

    // Processing Logic
    
    // 1. Clean Title
    let title = nextEvent.summary || 'Cours';
    title = title.replace(/^PBNC\.\d{2}-\d{2}\.CDP\.Montpellier —\s*/, '');
    title = title.replace(/^PBNC\..*? —\s*/, ''); // Generic cleanup just in case
    
    // 2. Parse Description
    const description = nextEvent.description || '';
    
    // Location
    let location = 'Présentiel';
    let meetLink = null;
    
    // Check for "Salle : Distanciel" or similar
    if (description.includes('Salle : Distanciel') || description.toLowerCase().includes('distanciel')) {
        location = 'Distanciel';
        // Extract meet link
        const linkMatch = description.match(/https:\/\/meet\.google\.com\/[a-z0-9-]+/);
        if (linkMatch) {
            meetLink = linkMatch[0];
        }
    }

    // Instructor
    // Look for email in description or organizer (Organizer is simpler if set properly but GCal often sets it to the calendar itself)
    // The user says "S'il y a un invité: Mettre Formateur : ...". 
    // In ICS, `organizer` or `attendee` might have it. Or text in description.
    // The prompt implies extracting from description if implicit, or any email.
    
    let instructor = null;
    
    // Try to find email lines in description
    // Common pattern: "Invités : email@..." or just lines with emails
    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
    const emails = description.match(emailRegex);
    
    if (emails) {
        // Filter out the calendar owner email itself if possible, but hard to know.
        // Usually the first human-looking email that isn't the group calendar.
        const filtered = emails.filter((e: string) => !e.includes('group.calendar.google.com'));
        if (filtered.length > 0) {
            instructor = filtered[0];
        }
    }

    // Final clean
    // Remove " — " trailing if any
    title = title.replace(/—\s*$/, '').trim();

    return NextResponse.json({
        found: true,
        title,
        location,
        meetLink,
        instructor,
        date: nextEvent.start,
        full_description: description
    });

  } catch (error) {
    console.error('Calendar fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch calendar' }, { status: 500 });
  }
}
