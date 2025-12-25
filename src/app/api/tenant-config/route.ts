
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';
import { NextResponse } from 'next/server';

if (getApps().length === 0) {
  initializeApp();
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId') || 'oreegami';

  try {
    const db = getFirestore();
    const doc = await db.collection('tenants').doc(tenantId).get();
    
    if (!doc.exists) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const data = doc.data();
    // Ne renvoyer que les infos publiques (pas les instructions système internes)
    return NextResponse.json({
      name: data?.name || "Assistant",
      systemGreeting: data?.systemGreeting || "Bonjour !",
      primaryColor: data?.primaryColor || "#FF5733",
      driveFolderId: data?.driveFolderId || ""
    });
  } catch (error: unknown) {
    console.error('Error fetching tenant config:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
