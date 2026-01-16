import { createClient } from '@supabase/supabase-js';

// Configuration (from existing project)
const SUPABASE_URL = 'https://pjiobifgcvdapikurlbn.supabase.co';
// Service Role Key is required to bypass RLS for seeding if RLS is strict, 
// or we can use the anon key if tables are open.
// Using the Service Key found in migrate_data.js to ensure permissions.
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqaW9iaWZnY3ZkYXBpa3VybGJuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTEwMjQ4MSwiZXhwIjoyMDgwNjc4NDgxfQ.TDVP4swScKmcyyrn9e3iXMRjEEiwQsSooGqpX70imEA';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
  console.log("🚀 Seeding Promos...");

  const promos = [
    { name: 'Promo Alpha (2024)', tuto_config: { sources: ['Micode', 'Grafikart'] }, video_config: { tags: ['IA', 'Actu'] } },
    { name: 'Promo Beta (2025)', tuto_config: {}, video_config: {} },
    { name: 'Promo Gama (No-Code)', tuto_config: { sources: ['Webflow', 'Bubble'] }, video_config: { tags: ['No-Code'] } }
  ];

  for (const p of promos) {
    // Check if exists
    const { data: existing } = await supabase.from('promos').select('id').eq('name', p.name).single();
    
    if (!existing) {
        const { error } = await supabase.from('promos').insert(p);
        if (error) {
            console.error(`❌ Error inserting ${p.name}:`, error.message);
        } else {
            console.log(`✅ Inserted ${p.name}`);
        }
    } else {
        console.log(`ℹ️ ${p.name} already exists.`);
    }
  }

  console.log("✨ Seeding complete.");
}

main();
