
import { ai } from './ai';
import { scrapeUrl } from './scraper';
import { z } from 'genkit';
import { google } from 'googleapis';
import { getFirestore, FieldValue, QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';

// Initialize Firebase Admin if not already done (for Firestore access)
if (getApps().length === 0) {
  initializeApp();
}

// Helper for embedding with retry logic
async function embedWithRetry(content: string, embedder: string, taskType: 'RETRIEVAL_QUERY' | 'RETRIEVAL_DOCUMENT', retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await ai.embed({
        embedder,
        content,
        options: { taskType }
      });
    } catch (err: any) {
      if (i === retries - 1) throw err;
      const is500 = err.message?.includes('500') || err.stack?.includes('500');
      if (is500) {
        console.warn(`[Retry ${i + 1}/${retries}] Embedding failed with 500, retrying in 1s...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        throw err;
      }
    }
  }
}

/**
 * Ingests documents from a Google Drive folder into Firestore Vector Store.
 * 
 * Note: Requires Google Service Account credentials or OAuth token with Drive scope.
 * For simplicity in this demo, we'll assume a Service Account key is provided via env var
 * or we use Application Default Credentials (ADC) if running in Cloud Functions.
 */
export const ingestDocuments = ai.defineFlow(
  {
    name: 'ingestDocuments',
    inputSchema: z.object({
      driveFolderId: z.string().describe('ID of the Google Drive folder to index'),
      tenantId: z.string().default('oreegami').describe('Tenant ID for multi-tenant isolation'),
    }),
    outputSchema: z.object({
      processedFiles: z.number(),
      errors: z.array(z.string()),
    }),
  },
  async ({ driveFolderId, tenantId }) => {


    const auth = new google.auth.GoogleAuth({
      keyFile: './service-account.json',
      scopes: ['https://www.googleapis.com/auth/drive'], // Full access needed for copy/delete operations
    });

    const drive = google.drive({ version: 'v3', auth });
    
    // 1. List files
    const res = await drive.files.list({
      q: `'${driveFolderId}' in parents and trashed = false`, 
      fields: 'files(id, name, mimeType, md5Checksum, version, webViewLink)',
    });

    console.log('Found files:', res.data.files?.map(f => `${f.name} (${f.mimeType})`));

    const files = res.data.files || [];
    let processedCount = 0;
    const errors: string[] = [];
    const db = getFirestore();

    for (const file of files) {
      if (!file.id) continue;

      try {
        // --- NEW: Incremental Update Logic ---
        // Check if file already exists in Firestore
        const existingDocsSnapshot = await db.collection('documents')
            .where('metadata.fileId', '==', file.id)
            .limit(1) // Just need one to check metadata
            .get();

        if (!existingDocsSnapshot.empty) {
            const existingDoc = existingDocsSnapshot.docs[0].data();
            const storedChecksum = existingDoc.metadata?.md5Checksum;
            const storedVersion = existingDoc.metadata?.version;

            // Logic: 
            // 1. If we have MD5 (binary files via Drive), check that.
            // 2. If no MD5 (GDocs), check 'version' field.
            let isMatch = false;

            if (file.md5Checksum) {
                isMatch = storedChecksum === file.md5Checksum;
            } else if (file.version) {
                 // For GDocs, use version
                 isMatch = storedVersion === file.version;
            }

            if (isMatch) {
                console.log(`Skipping unchanged file: ${file.name} (MD5: ${file.md5Checksum}, Version: ${file.version})`);
                continue;
            } else {
                console.log(`File updated or checksum/version missing: ${file.name} (Drive MD5: ${file.md5Checksum}, Version: ${file.version}). Deleting old versions...`);
                // Checksum mismatch or missing -> Delete ALL existing chunks for this file
                // Note: limit(1) above was just for checking. Now we need to find ALL chunks.
                const allOldDocsSnapshot = await db.collection('documents')
                    .where('metadata.fileId', '==', file.id)
                    .get();
                
                const deleteBatch = db.batch();
                allOldDocsSnapshot.docs.forEach((doc: QueryDocumentSnapshot) => deleteBatch.delete(doc.ref));
                await deleteBatch.commit();
                console.log(`Deleted ${allOldDocsSnapshot.size} old chunks.`);
            }
        }

        // 2. Download content
        let textContent = '';

        if (file.mimeType === 'application/vnd.google-apps.document') {
          // Export Google Docs to plain text
          const exportRes = await drive.files.export({
            fileId: file.id,
            mimeType: 'text/plain',
          }, { responseType: 'stream' });

          textContent = await new Promise<string>((resolve, reject) => {
             let data = '';
             exportRes.data.on('data', (chunk: any) => data += chunk);
             exportRes.data.on('end', () => resolve(data));
             exportRes.data.on('error', (err: any) => reject(err));
          });
        } else if (file.mimeType === 'text/plain') {
           // Download text files
           const contentRes = await drive.files.get({
            fileId: file.id,
            alt: 'media',
           }, { responseType: 'stream' });

           textContent = await new Promise<string>((resolve, reject) => {
             let data = '';
             contentRes.data.on('data', (chunk: any) => data += chunk);
             contentRes.data.on('end', () => resolve(data));
             contentRes.data.on('error', (err: any) => reject(err));
          });
        } else if (file.mimeType === 'application/pdf') {
             // Convert PDF to Google Doc (Temporary) to extract text via OCR
             console.log(`Converting PDF ${file.name} to GDoc for OCR...`);
             const copyRes = await drive.files.copy({
                fileId: file.id,
                requestBody: {
                    mimeType: 'application/vnd.google-apps.document'
                }
             });
             const tempFileId = copyRes.data.id;
             if (!tempFileId) throw new Error('Failed to create temp GDoc from PDF');

             try {
                 // Export the temporary GDoc to text
                 const exportRes = await drive.files.export({
                    fileId: tempFileId,
                    mimeType: 'text/plain',
                 }, { responseType: 'stream' });

                 textContent = await new Promise<string>((resolve, reject) => {
                     let data = '';
                     exportRes.data.on('data', (chunk: any) => data += chunk);
                     exportRes.data.on('end', () => resolve(data));
                     exportRes.data.on('error', (err: any) => reject(err));
                 });
             } finally {
                 // Clean up: Delete the temporary file
                 await drive.files.delete({ fileId: tempFileId });
                 console.log(`Deleted temp GDoc ${tempFileId}`);
             }

        } else if (file.mimeType === 'application/pdf') {
             // Download PDF
             const contentRes = await drive.files.get({
                fileId: file.id,
                alt: 'media',
             }, { responseType: 'arraybuffer' });
             
             // Parse with PDF.js
             try {
                // Use standard require for Node environment
                const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');
                
                const uint8Array = new Uint8Array(contentRes.data as unknown as ArrayBuffer);
                const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
                const pdfDocument = await loadingTask.promise;
                
                let extractedText = '';
                // Iterate over all pages
                for (let i = 1; i <= pdfDocument.numPages; i++) {
                    const page = await pdfDocument.getPage(i);
                    const tokenizedText = await page.getTextContent();
                    const pageText = tokenizedText.items.map((token: any) => token.str).join(' ');
                    extractedText += pageText + '\n';
                }
                
                textContent = extractedText;
                console.log(`Extracted ${textContent.length} chars from PDF ${file.name}`);

             } catch (e: any) {
                 console.error(`PDF.js parsing failed for ${file.name}:`, e);
                 throw new Error(`PDF Parsing failed: ${e.message}`);
             }

        } else {
             console.log(`Skipping unsupported file type: ${file.mimeType} (${file.name})`);
             continue;
        }


        // --- NEW: URL Expansion Logic ---
        // Basic heuristic: check if line looks lke a URL
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const potentialUrls = textContent.match(urlRegex) || [];
        
        if (potentialUrls.length > 0) {
            console.log(`Found ${potentialUrls.length} URLs in ${file.name}.`);
            
            for (const url of potentialUrls) {
                // Basic filtering
                if (url.includes('drive.google.com')) continue; // Don't cycle back to Drive
                
                const scrapedMarkdown = await scrapeUrl(url);
                if (scrapedMarkdown && scrapedMarkdown.length > 100) {
                     // Ingest as a separate document
                     console.log(`Ingesting scraped content from ${url} (${scrapedMarkdown.length} chars)`);
                     
                     // Chunking for scraped content
                     const pageChunks = scrapedMarkdown.split('\n\n').filter((c: string) => c.trim().length > 0);
                     const batch = db.batch(); // New batch for this page

                     for (let i = 0; i < pageChunks.length; i++) {
                        const chunk = pageChunks[i];
                        if (chunk.length < 50) continue; // Skip tiny chunks

                        const embedding = await embedWithRetry(chunk, 'googleai/text-embedding-004', 'RETRIEVAL_DOCUMENT');
                        const vector = (embedding as any)[0].embedding as number[];
                        
                         if (vector.some(isNaN)) continue;

                        const docRef = db.collection('documents').doc();
                        batch.set(docRef, {
                            content: chunk,
                            embedding: FieldValue.vector(vector),
                            metadata: {
                                source: 'web_scrape',
                                sourceUrl: url,
                                parentFileId: file.id,
                                fileName: file.name + ' (Scraped)',
                                chunkIndex: i
                            }
                        });
                     }
                     await batch.commit();
                }
            }
        }

        // 3. Chunking (Simple split for demo)
        console.log(`File: ${file.name}, Content Length: ${textContent.length}`);
        const chunks = textContent.split('\n\n').filter(c => c.trim().length > 0);
        console.log(`Generated ${chunks.length} chunks.`);

        // 4. Generate Embeddings & Store
        const batch = db.batch();
        
        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            console.log(`Embedding chunk of length ${chunk.length}...`);
            const embedding = await embedWithRetry(chunk, 'googleai/text-embedding-004', 'RETRIEVAL_DOCUMENT');
            
            // Fix: ai.embed returns [{ embedding: [...] }]
            const vectorRaw = (embedding as any)[0].embedding;
            const vector = vectorRaw as number[];

            if (vector.some(isNaN)) {
               console.error('ERROR: Embedding contains NaN values!');
               console.log('First 5 values:', vector.slice(0, 5));
               continue; // Skip faulty chunks
            }
            
            const docRef = db.collection('documents').doc();
            batch.set(docRef, {
                content: chunk,
                embedding: FieldValue.vector(vector), // Requires Firestore Vector Search enabled
                metadata: {
                    tenantId: tenantId, // Multi-tenant isolation
                    source: 'google_drive',
                    fileId: file.id,
                    fileName: file.name,
                    md5Checksum: file.md5Checksum || null, // Store checksum (or null for GDocs)
                    version: file.version, // Store version
                    sourceUrl: file.webViewLink || null, // Store clickable Drive link
                    chunkIndex: i
                }
            });
        }
        
        await batch.commit();
        processedCount++;

      } catch (error: any) {
        errors.push(`Error processing file ${file.name} (${file.id}): ${error.message}`);
      }
    }


    return { processedFiles: processedCount, errors };
  }
);
