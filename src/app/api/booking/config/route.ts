import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { getBookingConfig } from '@/lib/booking';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const calendarId = searchParams.get('calendarId');

  if (!calendarId) {
    return NextResponse.json({ error: 'Missing calendarId' }, { status: 400 });
  }

  try {
    const config = await getBookingConfig(calendarId);
    return NextResponse.json(config);
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
