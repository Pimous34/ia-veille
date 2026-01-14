const ical = require('node-ical');
const fs = require('fs');

const CALENDAR_URL = 'https://calendar.google.com/calendar/ical/c_648df9e785e29f211ec640213ba3a539239574b9adfdc67e69c8d5aac6dffbc2%40group.calendar.google.com/public/basic.ics';

async function debugCalendar() {
    console.log("Fetching...", CALENDAR_URL);
    try {
        const response = await fetch(CALENDAR_URL);
        const text = await response.text();
        console.log("Fetched bytes:", text.length);
        
        const data = ical.parseICS(text);
        
        const now = new Date(); // 2026-01-14
        console.log("Current Date:", now.toISOString());

        const events = Object.values(data).filter(e => e.type === 'VEVENT');
        console.log("Total Events:", events.length);
        
        // Sort events by date
        events.sort((a, b) => new Date(a.start) - new Date(b.start));
        
        // Show next 5 events
        const upcoming = events.filter(e => new Date(e.start) >= now).slice(0, 10);
        
        console.log("\n--- Upcoming Events ---");
        upcoming.forEach(e => {
            console.log(`\n[${e.start.toISOString()}] ${e.summary}`);
            console.log(`Description: ${e.description?.substring(0, 50)}...`);
            console.log(`Location: ${e.location}`);
        });

    } catch (e) {
        console.error("Error:", e);
    }
}

debugCalendar();
