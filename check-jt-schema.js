const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    console.log('Fetching table info...');
    // 2. Query a specific row to see actual data for the reported issue
    const { data, error } = await supabase
        .from('daily_news_videos')
        .select('*')
        .ilike('title', '%28 novembre 2025%') // Target the specific video
        .limit(1);

    if (error) {
        console.error('Error fetching data:', error);
    } else if (data && data.length > 0) {
        console.log('Sample data from daily_news_videos:');
        data.forEach((row, i) => {
            console.log(`Row ${i}:`);
            console.log('  title:', row.title);
            console.log('  script length:', row.script ? row.script.length : 'N/A');
            console.log('  FULL SCRIPT:', row.script);
            console.log('  metadata:', row.metadata);
        });
    } else {
        console.log('No data found in daily_news_videos to infer schema');
    }
}

checkSchema();
