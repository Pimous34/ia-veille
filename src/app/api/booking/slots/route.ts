import { NextResponse } from 'next/server';
import { getCalendarService, defaultCalendarId } from '@/lib/google-calendar';
import { addMinutes, addDays } from 'date-fns'; // Removed unused imports
import { getBookingConfig } from '@/lib/booking';

const BREAK_DURATION = 5; // minutes

export async function GET(request: Request) {
  try {
    const calendar = getCalendarService();
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
    
    // 1. Récupérer configuration
    const config = await getBookingConfig(targetCalendarId);
    const serviceId = searchParams.get('serviceId') || 'default';
    const targetService = config.services.find(s => s.id === serviceId) || config.services[0];
    const appointmentDuration = targetService.duration;
    
    // 2. Définir plage horaire en fonction du jour de la semaine
    // Date.getDay(): 0 (Dimanche) à 6 (Samedi). Config utilise '1' à '7' (ou '0'?) -> mapping.
    // Dans notre config default: '1' = Lundi.
    const dayOfWeek = targetDate.getUTCDay(); // 0 (Sun) - 6 (Sat)
    // Convertir JS getUTCDay() (0=Sun, 1=Mon) vers notre clé config (1=Mon, ..., 7=Sun ?)
    // Assumons standard ISO: 1=Mon, 7=Sun.
    let configDayKey = dayOfWeek.toString();
    if (dayOfWeek === 0) configDayKey = '7'; // Dimanche

    const dayConfig = config.workingHours[configDayKey];

    // Si pas de config pour ce jour (fermé), retourner vide
    if (!dayConfig) {
       return NextResponse.json({ success: true, timeSlots: [] });
    }

    const [startH, startM] = dayConfig.start.split(':').map(Number);
    const [endH, endM] = dayConfig.end.split(':').map(Number);

    const timeMin = new Date(Date.UTC(year, month - 1, day, startH, startM, 0));
    const timeMax = new Date(Date.UTC(year, month - 1, day, endH, endM, 0));

    // 3. Récupérer les événements du calendrier pour ce jour
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

    // 4. Générer tous les slots possibles et filtrer
    const availableSlots = [];
    let currentSlotStart = timeMin;

    while (currentSlotStart.getTime() + (appointmentDuration * 60000) <= timeMax.getTime()) {
      const currentSlotEnd = addMinutes(currentSlotStart, appointmentDuration);
      
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
          endTime: currentSlotEnd.toISOString(),
          serviceId: targetService.id // optionnel
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
