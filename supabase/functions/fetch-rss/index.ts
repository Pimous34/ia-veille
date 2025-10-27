// Edge Function: fetch-rss
// Fetches RSS feeds from configured sources and stores articles in the database
// Triggered by Supabase Cron every 8 hours

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';
import Parser from 'https://esm.sh/rss-parser@3.13.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Source {
  id: string;
  name: string;
  url: string;
  rss_url: string;
  type: string;
  is_active: boolean;
  last_fetch_date: string | null;
}

interface Article {
  title: string;
  url: string;
  canonical_url: string;
  rss_guid: string;
  excerpt: string;
  content: string;
  source_id: string;
  source_url: string;
  published_at: string;
  author?: string;
  image_url?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🚀 Starting RSS fetch job...');

    // Step 1: Fetch active RSS sources
    const { data: sources, error: sourcesError } = await supabase
      .from('sources')
      .select('*')
      .eq('type', 'rss')
      .eq('is_active', true);

    if (sourcesError) {
      throw new Error(`Failed to fetch sources: ${sourcesError.message}`);
    }

    if (!sources || sources.length === 0) {
      console.log('⚠️ No active RSS sources found');
      return new Response(
        JSON.stringify({ message: 'No active RSS sources found', articles_added: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📡 Found ${sources.length} active RSS sources`);

    // Step 2: Initialize RSS parser
    const parser = new Parser({
      timeout: 10000,
      headers: {
        'User-Agent': 'IA-Veille RSS Aggregator/1.0',
      },
    });

    let totalArticlesAdded = 0;
    const results: any[] = [];

    // Step 3: Process each source
    for (const source of sources as Source[]) {
      try {
        console.log(`📰 Fetching: ${source.name} (${source.rss_url})`);

        // Fetch and parse RSS feed
        const feed = await parser.parseURL(source.rss_url);
        console.log(`✅ Parsed ${feed.items.length} items from ${source.name}`);

        const articlesToInsert: Article[] = [];

        // Step 4: Process each item in the feed
        for (const item of feed.items) {
          if (!item.link || !item.title) {
            console.log('⚠️ Skipping item without link or title');
            continue;
          }

          // Prepare article data
          const article: Article = {
            title: item.title.substring(0, 500), // Limit to 500 chars
            url: item.link,
            canonical_url: item.link,
            rss_guid: item.guid || item.link,
            excerpt: item.contentSnippet?.substring(0, 500) || item.summary?.substring(0, 500) || '',
            content: item.content || item.contentSnippet || item.summary || '',
            source_id: source.id,
            source_url: source.url,
            published_at: item.pubDate || item.isoDate || new Date().toISOString(),
            author: item.creator || item.author || undefined,
            image_url: item.enclosure?.url || undefined,
          };

          articlesToInsert.push(article);
        }

        // Step 5: Batch upsert articles (deduplication by canonical_url)
        if (articlesToInsert.length > 0) {
          const { data: insertedArticles, error: insertError } = await supabase
            .from('articles')
            .upsert(articlesToInsert, {
              onConflict: 'canonical_url',
              ignoreDuplicates: true,
            })
            .select('id');

          if (insertError) {
            console.error(`❌ Error inserting articles for ${source.name}:`, insertError);
            
            // Update source with error status
            await supabase
              .from('sources')
              .update({
                fetch_error_count: (source as any).fetch_error_count + 1,
                last_error_message: insertError.message,
              })
              .eq('id', source.id);
          } else {
            const addedCount = insertedArticles?.length || 0;
            totalArticlesAdded += addedCount;
            console.log(`✅ Added ${addedCount} new articles from ${source.name}`);

            // Update source with success status
            await supabase
              .from('sources')
              .update({
                last_fetch_date: new Date().toISOString(),
                fetch_error_count: 0,
                last_error_message: null,
              })
              .eq('id', source.id);

            results.push({
              source: source.name,
              articles_found: articlesToInsert.length,
              articles_added: addedCount,
              status: 'success',
            });
          }
        } else {
          console.log(`ℹ️ No new articles to add from ${source.name}`);
          results.push({
            source: source.name,
            articles_found: 0,
            articles_added: 0,
            status: 'no_new_articles',
          });
        }
      } catch (error) {
        console.error(`❌ Error processing ${source.name}:`, error);
        
        // Update source with error
        await supabase
          .from('sources')
          .update({
            fetch_error_count: ((source as any).fetch_error_count || 0) + 1,
            last_error_message: error.message,
          })
          .eq('id', source.id);

        results.push({
          source: source.name,
          status: 'error',
          error: error.message,
        });
      }
    }

    console.log(`🎉 RSS fetch job completed. Total articles added: ${totalArticlesAdded}`);

    return new Response(
      JSON.stringify({
        message: 'RSS fetch completed',
        total_articles_added: totalArticlesAdded,
        sources_processed: sources.length,
        results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('❌ Fatal error in RSS fetch:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
