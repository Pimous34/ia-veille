
import { google } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/calendar'];

const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';

if (!privateKey || !clientEmail) {
  throw new Error('Missing Google Calendar credentials (GOOGLE_PRIVATE_KEY or GOOGLE_SERVICE_ACCOUNT_EMAIL)');
}

const auth = new google.auth.JWT(
  clientEmail,
  undefined,
  privateKey,
  SCOPES
);

const calendar = google.calendar({ version: 'v3', auth });

export { calendar, calendarId as defaultCalendarId };
