
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, cert, getApps } from 'firebase-admin/app';

// Initialize Firebase Admin (assuming service account is present)
// Note: This duplicates logic from genkit/index.ts, ideally should import common init
if (getApps().length === 0) {
    const serviceAccount = require('../../service-account.json');
    initializeApp({
        credential: cert(serviceAccount)
    });
}

async function backfillTenantId() {
    const db = getFirestore();
    const documents = await db.collection('documents').get();
    
    console.log(`Found ${documents.size} documents.`);
    
    const batch = db.batch();
    let count = 0;
    
    documents.forEach(doc => {
        const data = doc.data();
        if (!data.metadata || !data.metadata.tenantId) {
            batch.update(doc.ref, {
                'metadata.tenantId': 'oreegami'
            });
            count++;
        }
    });
    
    if (count > 0) {
        await batch.commit();
        console.log(`Successfully backfilled ${count} documents with tenantId: 'oreegami'.`);
    } else {
        console.log('No documents needed backfilling.');
    }
}

backfillTenantId().catch(console.error);
