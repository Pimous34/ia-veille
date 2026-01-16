import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK
// This works automatically on Google Cloud environments (App Hosting)
// For local dev, it needs GOOGLE_APPLICATION_CREDENTIALS or manually provided credentials.
// Here we use the existing env vars if available, or rely on App Default Credentials.

const apps = getApps();

if (!apps.length) {
    const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    let credential = undefined;

    if (serviceAccountEmail && privateKey) {
        credential = cert({
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'oreegamia', // Fallback or use env
            clientEmail: serviceAccountEmail,
            privateKey: privateKey,
        });
    }

    initializeApp({
        credential,
    });
}

export const db = getFirestore();
