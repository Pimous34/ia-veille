
import { NextResponse } from 'next/server';
import { calendar, calendarId } from '@/lib/google-calendar';
import { startOfMonth, endOfMonth, eachDayOfInterval, isWeekend, format, addDays } from 'date-fns';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || '');
    const month = parseInt(searchParams.get('month') || ''); // 1-12

    if (!year || !month) {
      return NextResponse.json({ error: 'Missing year or month' }, { status: 400 });
    }

    // Calculer les jours du mois
    // Note: month is 1-based in query, JS Date constructor uses 0-based for month index.
    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = endOfMonth(startDate);

    const daysInMonth = eachDayOfInterval({ start: startDate, end: endDate });

    // Récupérer les événements existants pour tout le mois pour optimiser
    const eventsResponse = await calendar.events.list({
      calendarId,
      timeMin: startDate.toISOString(),
      timeMax: endDate.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = eventsResponse.data.items || [];

    // Logique simplifiée : Vérifier si le jour est un jour de semaine (Mon-Fri)
    // Pour une vraie dispo, il faudrait vérifier slot par slot, mais ici on fait un premier filtre.
    
    const availableDays = daysInMonth.map(day => {
       const dayOfWeek = day.getDay(); // 0 = Dimanche, 6 = Samedi
       // On ouvre du Lundi au Samedi (Fermé Dimanche = 0)
       const isOpen = dayOfWeek !== 0; 
       
       return {
         day: day.getUTCDate(),
         hasTimeSlots: isOpen
       };
    });

    return NextResponse.json({ success: true, days: availableDays });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
