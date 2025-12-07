
const { createClient } = require('@supabase/supabase-js');

// CONFIG
const SUPABASE_URL = 'https://pjiobifgcvdapikurlbn.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqaW9iaWZnY3ZkYXBpa3VybGJuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTEwMjQ4MSwiZXhwIjoyMDgwNjc4NDgxfQ.TDVP4swScKmcyyrn9e3iXMRjEEiwQsSooGqpX70imEA';

const OLD_DOMAIN = 'https://jrlecaepyoivtplpvwoe.supabase.co';
const NEW_DOMAIN = 'https://pjiobifgcvdapikurlbn.supabase.co';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function fixUrls() {
    console.log("🔧 Fixing URLs in daily_news_videos...");

    const { data: videos, error } = await supabase
        .from('daily_news_videos')
        .select('*');

    if (error) {
        console.error("Error fetching videos:", error);
        return;
    }

    let count = 0;
    for (const video of videos) {
        let updates = {};
        
        if (video.video_url && video.video_url.includes(OLD_DOMAIN)) {
            updates.video_url = video.video_url.replace(OLD_DOMAIN, NEW_DOMAIN);
        }
        
        if (video.thumbnail_url && video.thumbnail_url.includes(OLD_DOMAIN)) {
            updates.thumbnail_url = video.thumbnail_url.replace(OLD_DOMAIN, NEW_DOMAIN);
        }

        if (Object.keys(updates).length > 0) {
            const { error: updateError } = await supabase
                .from('daily_news_videos')
                .update(updates)
                .eq('id', video.id);
            
            if (updateError) console.error(`Failed to update video ${video.id}:`, updateError);
            else count++;
        }
    }
    console.log(`✅ Updated ${count} videos.`);
}

async function fixArticles() {
    console.log("🔧 Fixing URLs in articles (if any)...");
    // Some articles might have images stored locally? Usually they are external.
    // But let's check.
    const { data: articles, error } = await supabase
        .from('articles')
        .select('*')
        .ilike('image_url', `%${OLD_DOMAIN}%`);

    if (error) { console.error("Error fetching articles:", error); return; }

    if (articles.length === 0) {
        console.log("✅ No articles with old domain found.");
        return;
    }

    console.log(`Found ${articles.length} articles with old domain.`);
    for (const article of articles) {
        const newUrl = article.image_url.replace(OLD_DOMAIN, NEW_DOMAIN);
        await supabase.from('articles').update({ image_url: newUrl }).eq('id', article.id);
    }
    console.log("✅ Articles updated.");
}

async function main() {
    await fixUrls();
    await fixArticles();
}

main();
