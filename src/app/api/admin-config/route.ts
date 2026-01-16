
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

if (getApps().length === 0) {
  initializeApp();
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin or teacher
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', user.id)
      .single();

    if (profile?.user_type !== 'admin' && profile?.user_type !== 'teacher') {
       return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { tenantId, config } = await req.json();

    if (!tenantId || !config) {
      return NextResponse.json({ error: 'Missing tenantId or config' }, { status: 400 });
    }

    const db = getFirestore();
    await db.collection('tenants').doc(tenantId).set({
      primaryColor: config.primaryColor,
      systemGreeting: config.systemGreeting,
      driveFolderId: config.driveFolderId,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error saving admin config:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
