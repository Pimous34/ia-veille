import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { genkit } from 'genkit';
import { googleAI, gemini15Flash } from '@genkit-ai/googleai';
import { logger } from 'genkit/logging';

// Configure logging
logger.setLogLevel('debug');

// Ensure GCLOUD_PROJECT is set (required for some Google Cloud APIs/Genkit plugins)
if (!process.env.GCLOUD_PROJECT) {
  process.env.GCLOUD_PROJECT = 'oreegamia'; 
}
if (!process.env.GOOGLE_CLOUD_PROJECT) {
  process.env.GOOGLE_CLOUD_PROJECT = 'oreegamia';
}

// Set Google Application Credentials for Vertex AI/Firestore (if not already set)
if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  // Try to find the service account file at root
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const fs = require('fs');
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const path = require('path');
  const keyPath = path.resolve(process.cwd(), 'service-account.json');
  if (fs.existsSync(keyPath)) {
     process.env.GOOGLE_APPLICATION_CREDENTIALS = keyPath;
  }
}

export const ai = genkit({
  plugins: [
    googleAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY }), 
  ],
  model: gemini15Flash, 
});
