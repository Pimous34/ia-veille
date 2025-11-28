
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Charger les variables d'environnement
const envConfig = dotenv.parse(fs.readFileSync('.env.local'));

const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = envConfig.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function uploadJingle() {
  const jinglePath = path.join(process.cwd(), 'public', 'video', 'Jingle.mp4');
  
  if (!fs.existsSync(jinglePath)) {
    console.error(`❌ File not found: ${jinglePath}`);
    process.exit(1);
  }

  const fileBuffer = fs.readFileSync(jinglePath);
  
  console.log('📤 Uploading Jingle.mp4 to Supabase Storage (jt-assets)...');
  
  const { data, error } = await supabase.storage
    .from('jt-assets')
    .upload('assets/jingle.mp4', fileBuffer, {
      contentType: 'video/mp4',
      upsert: true
    });

  if (error) {
    console.error('❌ Upload failed:', error.message);
    process.exit(1);
  }

  console.log('✅ Upload successful!');
  
  const { data: publicUrlData } = supabase.storage
    .from('jt-assets')
    .getPublicUrl('assets/jingle.mp4');

  console.log(`🔗 Public URL: ${publicUrlData.publicUrl}`);
}

uploadJingle();
