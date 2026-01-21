
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFetch() {
    console.log('Testing connection to:', supabaseUrl);

    const { data, error } = await supabase
        .from('daily_news_videos')
        .select('*')
        .limit(5);

    if (error) {
        console.error('Error fetching daily_news_videos:', error);
    } else {
        console.log('Successfully fetched daily_news_videos:', data);
        console.log('Count:', data.length);
    }
}

testFetch();
