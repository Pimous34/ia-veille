
import { google } from 'googleapis';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function createIndex() {
  console.log('Authenticating...');
  const auth = new google.auth.GoogleAuth({
    keyFile: './service-account.json',
    scopes: ['https://www.googleapis.com/auth/cloud-platform']
  });

  const firestore = google.firestore({ version: 'v1', auth });
  const name = 'projects/oreegamia/databases/(default)/collectionGroups/documents/fields/embedding';
  
  console.log(`Targeting field: ${name}`);

  try {
      console.log('Patching field configuration to include Vector Index...');
      
      // We explicitly define the indexes we want for this field.
      // For an embedding field, we typically ONLY want the Vector Index to save write costs.
      const indexes = [
          { 
            queryScope: 'COLLECTION', 
            fields: [{ 
                fieldPath: 'embedding', 
                vectorConfig: { dimension: 768, flat: {} } 
            }] 
          }
      ];
      
      const res = await firestore.projects.databases.collectionGroups.fields.patch({
          name: name,
          updateMask: 'indexConfig',
          requestBody: {
              indexConfig: {
                  indexes: indexes
              }
          }
      });
      
      console.log('Operation launched successfully!');
      if (res.data.name) {
          console.log('Field updated:', res.data.name);
          console.log('Index configuration might take a few minutes to build.');
      }
      
  } catch (error: any) {
      console.error('Error creating index:', error.message);
      if (error.response) {
          console.error('Response data:', JSON.stringify(error.response.data, null, 2));
      }
  }
}

createIndex();
