
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { ingestDocuments } from './ingest';

async function run() {
  try {
    console.log('Starting ingestion test...');
    const result = await ingestDocuments({
      driveFolderId: '1f4zikRox4qnnT8IkC12-Po8qZLFyVcyX'
    });
    console.log('Ingestion result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Ingestion failed:', error);
  }
}

run();
