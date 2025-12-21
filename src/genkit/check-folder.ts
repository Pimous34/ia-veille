
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { google } from 'googleapis';

async function checkFolder() {
  const auth = new google.auth.GoogleAuth({
    keyFile: './service-account.json',
    scopes: ['https://www.googleapis.com/auth/drive'],
  });

  const drive = google.drive({ version: 'v3', auth });
  const folderId = '1f4zikRox4qnnT8IkC12-Po8qZLFyVcyX';

  try {
    const res = await drive.files.get({
      fileId: folderId,
      fields: 'id, name, driveId, mimeType, owners',
      supportsAllDrives: true,
    });
    console.log('Folder Details:', res.data);
    if (res.data.driveId) {
        console.log("-> This IS in a Shared Drive (Team Drive).");
    } else {
        console.log("-> This is a regular My Drive folder (Quota issue likely).");
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

checkFolder();
