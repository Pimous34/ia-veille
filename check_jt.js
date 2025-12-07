
const { createClient } = require('@supabase/supabase-js');

// New Project
const SUPABASE_URL = 'https://pjiobifgcvdapikurlbn.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqaW9iaWZnY3ZkYXBpa3VybGJuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTEwMjQ4MSwiZXhwIjoyMDgwNjc4NDgxfQ.TDVP4swScKmcyyrn9e3iXMRjEEiwQsSooGqpX70imEA';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function check() {
    console.log("🔍 Checking 'daily_news_videos' on new project...");

    const { data, error } = await supabase
        .from('daily_news_videos')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("❌ Error querying daily_news_videos:", error);
    } else {
        console.log(`✅ Found ${data.length} rows.`);
        if (data.length > 0) {
            const latest = data[0];
            console.log("Latest JT:", JSON.stringify(latest, null, 2));
            console.log("Status:", latest.status);
            console.log("Video URL:", latest.video_url);
        }
    }
}

check();
