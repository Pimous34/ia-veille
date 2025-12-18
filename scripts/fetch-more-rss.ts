
import { createClient } from '@supabase/supabase-js';
import Parser from 'rss-parser';

const SUPABASE_URL = 'https://pjiobifgcvdapikurlbn.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqaW9iaWZnY3ZkYXBpa3VybGJuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTEwMjQ4MSwiZXhwIjoyMDgwNjc4NDgxfQ.TDVP4swScKmcyyrn9e3iXMRjEEiwQsSooGqpX70imEA';

interface Article {
  title: string;
  url: string;
  canonical_url: string;
  rss_guid: string;
  published_at: string;
  source_id: string; 
  image_url?: string;
  excerpt?: string;
}

async function fetchAndProcess() {
  console.log('🧪 Fetching RSS for Ludovic Salenne & GEEK CONCEPT...\n');

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const parser = new Parser();

  try {
    const { data: sources, error: sourcesError } = await supabase
      .from('sources')
      .select('*')
      .in('name', ['Ludovic Salenne', 'GEEK CONCEPT']) 
      .eq('type', 'rss')
      .eq('is_active', true);

    if (sourcesError) throw new Error(`Erreur sources: ${sourcesError.message}`);
    console.log(`✅ ${sources?.length || 0} sources trouvées.`);

    if (!sources || sources.length === 0) return;

    for (const source of sources) {
        console.log(`\nTraitement de : ${source.name} (${source.rss_url})`);
        try {
            const feed = await parser.parseURL(source.rss_url);
            const articlesToInsert: Article[] = [];
            
            for (const item of feed.items) {
                if (!item.link || !item.title) continue;
                
                let imageUrl = item.enclosure?.url;
                if (!imageUrl && (item.link.includes('youtube.com') || item.link.includes('youtu.be'))) {
                    let videoId = null;
                    if (item.link.includes('v=')) {
                        videoId = new URLSearchParams(new URL(item.link).search).get('v');
                    } else if (item.link.includes('youtu.be/')) {
                         videoId = item.link.split('youtu.be/')[1]?.split('?')[0];
                    }
                    if (!videoId && item.guid && item.guid.startsWith('yt:video:')) {
                        videoId = item.guid.split(':')[2];
                    }
                    if (videoId) {
                        imageUrl = `https://i3.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
                    }
                }

                const article: Article = {
                    title: item.title,
                    url: item.link,
                    canonical_url: item.link,
                    rss_guid: item.guid || item.link,
                    published_at: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
                    source_id: source.id,
                    image_url: imageUrl,
                    excerpt: item.contentSnippet || item.content || ''
                };
                articlesToInsert.push(article);
            }

            console.log(`   -> ${articlesToInsert.length} articles trouvés.`);

            if (articlesToInsert.length > 0) {
                 const { data: inserted, error: insertError } = await supabase
                    .from('articles')
                    .upsert(articlesToInsert, {
                        onConflict: 'canonical_url',
                        ignoreDuplicates: true
                    })
                    .select();

                 if (insertError) console.error(`   ❌ Erreur insertion: ${insertError.message}`);
                 else console.log(`   ✅ ${inserted?.length || 0} nouveaux articles insérés.`);
            }

        } catch (e) {
            console.error(`   ❌ Erreur traitement flux: ${e}`);
        }
    }

  } catch (error) {
    console.error('\n❌ Erreur globale:', error);
  }
}

fetchAndProcess();
