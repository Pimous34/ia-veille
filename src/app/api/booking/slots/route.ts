
import { NextResponse } from 'next/server';
import { calendar, defaultCalendarId } from '@/lib/google-calendar';
import { setHours, setMinutes, addMinutes, isBefore, formatISO, parseISO } from 'date-fns';

const APPOINTMENT_DURATION = 40; // minutes
const BREAK_DURATION = 5; // minutes
const START_HOUR = 9;
const END_HOUR = 18; // 6 PM

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || '');
    const month = parseInt(searchParams.get('month') || '');
    const day = parseInt(searchParams.get('day') || '');
    const targetCalendarId = searchParams.get('calendarId') || defaultCalendarId;

    if (!year || !month || !day) {
      return NextResponse.json({ error: 'Missing params' }, { status: 400 });
    }

    // Date cible (UTC)
    const targetDate = new Date(Date.UTC(year, month - 1, day));
    
    // Définir plage horaire de la journée (9h - 18h)
    const timeMin = new Date(Date.UTC(year, month - 1, day, START_HOUR, 0, 0));
    const timeMax = new Date(Date.UTC(year, month - 1, day, END_HOUR, 0, 0));

    // 1. Récupérer les événements du calendrier pour ce jour
    const response = await calendar.events.list({
      calendarId: targetCalendarId,
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    const busySlots = response.data.items?.map(event => ({
      start: new Date(event.start?.dateTime || event.start?.date!).getTime(),
      end: new Date(event.end?.dateTime || event.end?.date!).getTime(),
    })) || [];

    // 2. Générer tous les slots possibles et filtrer
    const availableSlots = [];
    let currentSlotStart = timeMin;

    while (currentSlotStart.getTime() + (APPOINTMENT_DURATION * 60000) <= timeMax.getTime()) {
      const currentSlotEnd = addMinutes(currentSlotStart, APPOINTMENT_DURATION);
      
      // Vérifier collision
      const isBusy = busySlots.some(busy => {
        return (
          (currentSlotStart.getTime() >= busy.start && currentSlotStart.getTime() < busy.end) || // Début dedans
          (currentSlotEnd.getTime() > busy.start && currentSlotEnd.getTime() <= busy.end) ||   // Fin dedans
          (currentSlotStart.getTime() <= busy.start && currentSlotEnd.getTime() >= busy.end)   // Englobe
        );
      });

      if (!isBusy) {
        availableSlots.push({
          startTime: currentSlotStart.toISOString(),
          endTime: currentSlotEnd.toISOString()
        });
      }

      // Prochain slot : Fin du courant + Break
      currentSlotStart = addMinutes(currentSlotEnd, BREAK_DURATION);
    }

    return NextResponse.json({ success: true, timeSlots: availableSlots });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
