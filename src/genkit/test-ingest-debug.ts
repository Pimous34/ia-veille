
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { ingestDocuments } from './ingest';

async function run() {
  try {
    console.log('Starting DEBUG ingestion test...');
    // Using the ID from previous context or test-ingest.ts
    const folderId = '1f4zikRox4qnnT8IkC12-Po8qZLFyVcyX'; 
    console.log(`Target Folder ID: ${folderId}`);

    const result = await ingestDocuments({
      driveFolderId: folderId
    });
    console.log('Ingestion result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Ingestion failed:', error);
  }
}

run();
