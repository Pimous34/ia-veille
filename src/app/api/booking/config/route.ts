import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const calendarId = searchParams.get('calendarId');

  if (!calendarId) {
    return NextResponse.json({ error: 'Missing calendarId' }, { status: 400 });
  }

  try {
    const doc = await db.collection('booking_configs').doc(calendarId).get();
    
    if (!doc.exists) {
      // Return default config if none exists
      return NextResponse.json({
        services: [{ id: 'default', name: 'Rendez-vous standard', duration: 30, price: 0 }],
        workingHours: {
          '1': { start: '09:00', end: '17:00' },
          '2': { start: '09:00', end: '17:00' },
          '3': { start: '09:00', end: '17:00' },
          '4': { start: '09:00', end: '17:00' },
          '5': { start: '09:00', end: '17:00' },
        }
      });
    }

    return NextResponse.json(doc.data());
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { calendarId, services, workingHours } = body;

    if (!calendarId) {
      return NextResponse.json({ error: 'Missing calendarId' }, { status: 400 });
    }

    await db.collection('booking_configs').doc(calendarId).set({
      services,
      workingHours,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
