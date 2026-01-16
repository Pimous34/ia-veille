
import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { Readable } from 'stream';

// Helper to convert buffer to stream
function bufferToStream(buffer: Buffer) {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const userEmail = formData.get('userEmail') as string;

    if (!file || !userEmail) {
      return NextResponse.json({ error: 'File and User Email are required' }, { status: 400 });
    }

    // 1. Authenticate with Service Account
    const auth = new google.auth.GoogleAuth({
      keyFile: './service-account.json',
      scopes: ['https://www.googleapis.com/auth/drive'],
    });
    const drive = google.drive({ version: 'v3', auth });

    // 2. Use the existing Oreegami shared folder as root
    // This folder (from ingest config) is owned by the organization/admin
    // The Service Account should have "Editor" rights on this specific folder.
    const rootFolderId = '1f4zikRox4qnnT8IkC12-Po8qZLFyVcyX'; 

    // 3. Find or Create User Folder inside Root
    let userFolderId = '';
    const userQuery = await drive.files.list({
      q: `name = '${userEmail}' and '${rootFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
      fields: 'files(id)',
    });

    if (userQuery.data.files && userQuery.data.files.length > 0) {
      userFolderId = userQuery.data.files[0].id!;
    } else {
      const userFolder = await drive.files.create({
        requestBody: {
          name: userEmail,
          parents: [rootFolderId],
          mimeType: 'application/vnd.google-apps.folder',
        },
        fields: 'id',
      });
      userFolderId = userFolder.data.id!;

      // Share this folder with the user (Editor access)
      await drive.permissions.create({
        fileId: userFolderId,
        requestBody: {
          role: 'writer',
          type: 'user',
          emailAddress: userEmail,
        },
      });
    }

    // 4. Upload File
    const buffer = Buffer.from(await file.arrayBuffer());
    const media = {
      mimeType: file.type,
      body: bufferToStream(buffer),
    };

    const uploadRes = await drive.files.create({
      requestBody: {
        name: file.name,
        parents: [userFolderId],
      },
      media: media,
      fields: 'id, name, webViewLink, webContentLink',
    });

    return NextResponse.json({
      success: true,
      fileId: uploadRes.data.id,
      link: uploadRes.data.webViewLink,
      name: uploadRes.data.name
    });

  } catch (error: any) {
    console.error('Upload Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
