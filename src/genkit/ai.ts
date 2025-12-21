import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { genkit } from 'genkit';
import { googleAI, gemini15Flash } from '@genkit-ai/googleai';
import { logger } from 'genkit/logging';

// Configure logging
logger.setLogLevel('debug');

import * as fs from 'fs';

// Ensure GCLOUD_PROJECT is set
if (!process.env.GCLOUD_PROJECT) {
  process.env.GCLOUD_PROJECT = 'oreegamia'; 
}
if (!process.env.GOOGLE_CLOUD_PROJECT) {
  process.env.GOOGLE_CLOUD_PROJECT = 'oreegamia';
}

// Set Google Application Credentials for Vertex AI/Firestore
if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  const keyPath = path.resolve(process.cwd(), 'service-account.json');
  if (fs.existsSync(keyPath)) {
     process.env.GOOGLE_APPLICATION_CREDENTIALS = keyPath;
  }
}

// Security: API key status check (Secrets fixed in Secret Manager)
if (!process.env.GOOGLE_GENAI_API_KEY) {
  console.warn('WARNING: GOOGLE_GENAI_API_KEY is not defined in environment variables!');
} else {
  console.log(`GOOGLE_GENAI_API_KEY is defined (length: ${process.env.GOOGLE_GENAI_API_KEY.length})`);
}

export const ai = genkit({
  plugins: [
    googleAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY }), 
  ],
  model: gemini15Flash, 
});
