
import { google } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/calendar'];

let calendarInstance: any = null;

export function getCalendarService() {
  if (calendarInstance) return calendarInstance;

  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;

  if (!privateKey || !clientEmail) {
    throw new Error('Missing Google Calendar credentials (GOOGLE_PRIVATE_KEY or GOOGLE_SERVICE_ACCOUNT_EMAIL)');
  }

  const auth = new google.auth.JWT(
    clientEmail,
    undefined,
    privateKey,
    SCOPES
  );

  calendarInstance = google.calendar({ version: 'v3', auth });
  return calendarInstance;
}

export const defaultCalendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';
