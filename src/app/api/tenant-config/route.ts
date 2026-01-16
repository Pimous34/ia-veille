
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert, type ServiceAccount } from 'firebase-admin/app';
import { NextResponse } from 'next/server';

if (getApps().length === 0) {
  // Use explicit credentials if available to avoid "Unable to detect Project Id"
  const serviceAccount = {
    projectId: 'oreegamia', // Hardcoded or from env
    clientEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    privateKey: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  };

  if (serviceAccount.clientEmail && serviceAccount.privateKey) {
     initializeApp({
       credential: cert(serviceAccount)
     });
     console.log('Firebase Admin initialized with Service Account');
  } else {
     // Fallback to ADC if no env vars (likely to fail in this environment)
     console.log('Firebase Admin initializing with default credentials');
     initializeApp(); 
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId') || 'oreegamia';

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
  } catch (error: any) {
    console.error('Error fetching tenant config:', error);
    // Include error message for debugging
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
