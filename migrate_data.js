
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const https = require('https');

// --- CONFIGURATION ---

// OLD PROJECT (Source)
const OLD_URL = 'https://jrlecaepyoivtplpvwoe.supabase.co';
const OLD_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpybGVjYWVweW9pdnRwbHB2d29lIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTU3NDI4NiwiZXhwIjoyMDc3MTUwMjg2fQ.rzzfmguz5maKd2Jd9RknA9cYcbvw3MDa8Mzos-RXGvE'; // Service Role

// NEW PROJECT (Destination)
const NEW_URL = 'https://pjiobifgcvdapikurlbn.supabase.co';
const NEW_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqaW9iaWZnY3ZkYXBpa3VybGJuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTEwMjQ4MSwiZXhwIjoyMDgwNjc4NDgxfQ.TDVP4swScKmcyyrn9e3iXMRjEEiwQsSooGqpX70imEA'; // Service Role

const oldClient = createClient(OLD_URL, OLD_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
const newClient = createClient(NEW_URL, NEW_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

// --- UTILS ---

async function migrateTable(tableName, idField = 'id', foreignKeyColumns = []) {
    console.log(`\n📦 Migrating table '${tableName}'...`);
    
    // Fetch all rows from OLD
    const { data: rows, error: fetchError } = await oldClient.from(tableName).select('*');
    if (fetchError) {
        console.error(`❌ Error fetching ${tableName}:`, fetchError.message);
        return;
    }
    
    if (!rows || rows.length === 0) {
        console.log(`⚠️ Table '${tableName}' is empty.`);
        return;
    }

    console.log(`✅ Found ${rows.length} rows in '${tableName}'. Inserting...`);

    // Insert in chunks to avoid payload limits
    const CHUNK_SIZE = 100;
    for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
        const chunk = rows.slice(i, i + CHUNK_SIZE);
        const { error: insertError } = await newClient.from(tableName).upsert(chunk, { onConflict: idField });
        
        if (insertError) {
            console.error(`❌ Error inserting chunk ${i}-${i+CHUNK_SIZE}:`, insertError.message);
            // Hint: "violates foreign key constraint" -> means order details might be wrong
        } else {
            console.log(`   -> Inserted rows ${i+1} to ${Math.min(i+CHUNK_SIZE, rows.length)}`);
        }
    }
    console.log(`✨ Table '${tableName}' migration finished.`);
}

async function listAllFiles(client, bucketName, path = '') {
    const { data, error } = await client.storage.from(bucketName).list(path, { limit: 100, offset: 0 });
    if (error) throw error;
    
    let files = [];
    for (const item of data) {
        if (item.id === null) {
            // It's a folder
            const subFiles = await listAllFiles(client, bucketName, `${path}${item.name}/`);
            files = files.concat(subFiles);
        } else {
            files.push({ ...item, fullPath: `${path}${item.name}` });
        }
    }
    return files;
}

async function migrateBucket(bucketName) {
    console.log(`\n🗂️ Migrating Storage Bucket '${bucketName}'...`);
    
    try {
        // List files in OLD bucket
        const files = await listAllFiles(oldClient, bucketName);
        console.log(`   Found ${files.length} files.`);

        for (const file of files) {
            const filePath = file.fullPath;
            console.log(`   ⬇️ Downloading '${filePath}'...`);
            
            // Download
            const { data: blob, error: downError } = await oldClient.storage.from(bucketName).download(filePath);
            if (downError) {
                console.error(`   ❌ Failed to download '${filePath}':`, downError.message);
                continue;
            }

            // Convert blob to arrayBuffer (node-fetch style) or Buffer
            const arrayBuffer = await blob.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            // Upload to NEW
            console.log(`   ⬆️ Uploading '${filePath}'...`);
            const { error: upError } = await newClient.storage.from(bucketName).upload(filePath, buffer, {
                contentType: file.metadata?.mimetype || 'application/octet-stream',
                upsert: true
            });

            if (upError) {
                 // Check if bucket exists
                 if (upError.message.includes('Bucket not found')) {
                     console.log(`   ⚠️ Bucket '${bucketName}' missing on target. Creating...`);
                     await newClient.storage.createBucket(bucketName, { public: true });
                     // Retry
                     await newClient.storage.from(bucketName).upload(filePath, buffer, { upsert: true });
                 } else {
                    console.error(`   ❌ Failed to upload '${filePath}':`, upError.message);
                 }
            } else {
                console.log(`   ✅ Transferred.`);
            }
        }

    } catch (e) {
        console.error(`❌ Error migrating bucket '${bucketName}':`, e.message);
    }
}

// --- MAIN ---

async function main() {
    console.log("🚀 Starting Data Migration...");
    
    // 1. Tables (Order matters for Foreign Keys!)
    // Schema based on 'backup_schema.sql': sources -> articles -> user_profiles -> ...
    
    await migrateTable('sources');
    await migrateTable('articles');
    
    // Check if 'daily_news_videos' exists (it contains video links)
    // Also 'user_profiles' if needed
    try {
        await migrateTable('daily_news_videos');
    } catch (e) { console.log("Skipping daily_news_videos (maybe doesn't exist yet)"); }

    // 2. Storage
    // Common buckets: 'videos', 'generated_videos', 'images'
    // I will list buckets first
    const { data: buckets } = await oldClient.storage.listBuckets();
    if (buckets) {
        for (const bucket of buckets) {
            await migrateBucket(bucket.name);
        }
    }

    console.log("\n🏁 Migration Complete!");
}

main();
