import { NextResponse } from 'next/server';

const CALENDAR_URL = 'https://calendar.google.com/calendar/ical/c_648df9e785e29f211ec640213ba3a539239574b9adfdc67e69c8d5aac6dffbc2%40group.calendar.google.com/public/basic.ics';

export const dynamic = 'force-dynamic';

// Helper to parse ICS date strings like 20260114T083000Z or 20260114
function parseICSDate(dateStr: string): Date | null {
    if (!dateStr) return null;
    const cleanStr = dateStr.replace('Z', '').trim();
    
    // YYYYMMDD
    if (cleanStr.length === 8) {
        const y = parseInt(cleanStr.substring(0, 4));
        const m = parseInt(cleanStr.substring(4, 6)) - 1;
        const d = parseInt(cleanStr.substring(6, 8));
        return new Date(y, m, d);
    }
    // YYYYMMDDTHHMMSS
    if (cleanStr.length >= 15) {
        const y = parseInt(cleanStr.substring(0, 4));
        const m = parseInt(cleanStr.substring(4, 6)) - 1;
        const d = parseInt(cleanStr.substring(6, 8));
        const h = parseInt(cleanStr.substring(9, 11));
        const min = parseInt(cleanStr.substring(11, 13));
        const s = parseInt(cleanStr.substring(13, 15));
        
        // Assume simple parsing. If Z is present, it's UTC.
        if (dateStr.endsWith('Z')) {
            return new Date(Date.UTC(y, m, d, h, min, s));
        }
        return new Date(y, m, d, h, min, s);
    }
    return null;
}

// Helper to unescape ICS text
function unescapeICS(str: string) {
    if (!str) return '';
    return str.replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\n/g, '\n').replace(/\\\\/g, '\\');
}

export async function GET() {
  try {
    console.log("Fetching calendar from:", CALENDAR_URL);
    const response = await fetch(CALENDAR_URL, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Node.js/Next.js)'
        },
        next: { revalidate: 60 } // Lower cache for debugging
    });
    
    if (!response.ok) {
        throw new Error(`Failed to fetch ICS: ${response.status} ${response.statusText}`);
    }

    const icsText = await response.text();
    
    // --- 1. Manual ICS Parsing (Line Unfolding) ---
    const rawLines = icsText.split(/\r\n|\n|\r/);
    const lines: string[] = [];
    for (const line of rawLines) {
        if (line.startsWith(' ') || line.startsWith('\t')) {
            // Folded line: append to previous
            if (lines.length > 0) {
                lines[lines.length - 1] += line.substring(1);
            }
        } else {
            lines.push(line);
        }
    }

    // --- 2. Extract Events (VEVENT) ---
    const events: any[] = [];
    let currentEvent: any = null;
    let inEvent = false;

    for (const line of lines) {
        if (line.startsWith('BEGIN:VEVENT')) {
            inEvent = true;
            currentEvent = {};
            continue;
        }
        if (line.startsWith('END:VEVENT')) {
            inEvent = false;
            // Validate event has dates
            if (currentEvent && currentEvent.dtstart) {
                // If no end date, assume start time
                if (!currentEvent.dtend) currentEvent.dtend = currentEvent.dtstart;
                events.push(currentEvent);
            }
            currentEvent = null;
            continue;
        }

        if (inEvent && currentEvent) {
            // Key:Value splitting
            // Careful with colons in value. Split on first colon.
            const splitIdx = line.indexOf(':');
            if (splitIdx === -1) continue;

            let keyPart = line.substring(0, splitIdx);
            let valuePart = line.substring(splitIdx + 1);

            // Handle params in key (e.g., DTSTART;TZID=...:)
            const keyParams = keyPart.split(';');
            const key = keyParams[0];

            if (key === 'SUMMARY') {
                currentEvent.summary = unescapeICS(valuePart);
            } else if (key === 'DESCRIPTION') {
                currentEvent.description = unescapeICS(valuePart);
            } else if (key === 'LOCATION') {
                currentEvent.location = unescapeICS(valuePart);
            } else if (key === 'DTSTART') {
                 currentEvent.dtstart = parseICSDate(valuePart);
            } else if (key === 'DTEND') {
                 currentEvent.dtend = parseICSDate(valuePart);
            }
        }
    }

    // --- 3. Filtering Logic ---
    const now = new Date();
    
    // Keep events that end after NOW
    const activeEvents = events.filter(e => {
        if (!e.dtstart || !e.dtend) return false;
        return e.dtend >= now;
    });

    if (activeEvents.length === 0) {
        return NextResponse.json({ found: false, message: 'No upcoming events found.' });
    }

    // Sort by start time
    activeEvents.sort((a, b) => a.dtstart.getTime() - b.dtstart.getTime());

    const nextEvent = activeEvents[0];

    // --- 4. Processing Logic (Same as before) ---
    
    // Clean Title
    let title = nextEvent.summary || 'Cours';
    title = title.replace(/^PBNC\.\d{2}-\d{2}\.CDP\.[^—]+—\s*/, '');
    title = title.replace(/^PBNC\..*? —\s*/, ''); 
    title = title.replace(/—\s*$/, '').trim();

    // Clean Description
    const description = nextEvent.description || '';

    // Location & Meet
    let location = 'Présentiel';
    let meetLink = null;
    if (description.includes('Salle : Distanciel') || description.toLowerCase().includes('distanciel')) {
        location = 'Distanciel';
        const linkMatch = description.match(/https:\/\/meet\.google\.com\/[a-z0-9-]+/);
        if (linkMatch) meetLink = linkMatch[0];
    } else if (nextEvent.location) {
        location = nextEvent.location;
    }

    // Instructor
    let instructor = null;
    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
    const emails = description.match(emailRegex);
    if (emails) {
        const filtered = emails.filter((e: string) => !e.includes('group.calendar.google.com'));
        if (filtered.length > 0) instructor = filtered[0];
    }

    return NextResponse.json({
        found: true,
        title,
        location,
        meetLink,
        instructor,
        date: nextEvent.dtstart,
        full_description: description
    });

  } catch (error: any) {
    console.error('Manual Calendar fetch error:', error);
    return NextResponse.json({ 
        error: 'Failed to fetch calendar', 
        details: error.message || String(error) 
    }, { status: 500 });
  }
}
