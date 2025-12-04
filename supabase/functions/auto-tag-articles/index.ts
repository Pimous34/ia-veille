// Edge Function: auto-tag-articles
// Automatically tags articles based on their title content
// Can be triggered via Cron or Webhook

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Keywords for auto-tagging (Same as frontend for consistency)
const tagKeywords: Record<string, string[]> = {
    'ChatGPT': ['chatgpt', 'openai', 'gpt'],
    'Gemini': ['gemini', 'google', 'bard'],
    'Claude': ['claude', 'anthropic'],
    'Midjourney': ['midjourney'],
    'DALL-E': ['dall-e', 'dalle'],
    'Mistral': ['mistral'],
    'Llama': ['llama', 'meta'],
    'Microsoft': ['microsoft', 'copilot', 'bing'],
    'Apple': ['apple', 'siri'],
    'Bubble': ['bubble'],
    'Webflow': ['webflow'],
    'Make': ['make', 'integromat'],
    'Zapier': ['zapier'],
    'n8n': ['n8n'],
    'FlutterFlow': ['flutterflow'],
    'Cursor': ['cursor'],
    'Replit': ['replit'],
    'Bolt': ['bolt'],
    'V0': ['v0'],
    'Windsurf': ['windsurf'],
    'IA': ['ia', 'ai', 'intelligence artificielle', 'artificial intelligence'],
    'No-Code': ['no-code', 'nocode', 'low-code', 'lowcode'],
    'Automatisation': ['automatisation', 'automation']
};

function generateTagsFromTitle(title: string): string[] {
    const tags: string[] = [];
    const lowerTitle = title.toLowerCase();
    
    for (const [tag, keywords] of Object.entries(tagKeywords)) {
        if (keywords.some(keyword => lowerTitle.includes(keyword))) {
            tags.push(tag);
        }
    }
    return tags;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🏷️ Starting auto-tagging process...');

    // Fetch articles with no tags (null or empty array)
    // Note: Supabase/Postgres array checks can be tricky. 
    // We'll fetch articles where tags is null or length is 0.
    // Since 'is' null check + 'eq' [] might be separate queries, 
    // we'll fetch a batch of recent articles and filter in code if needed, 
    // or use a specific filter if possible. 
    // Let's try fetching where tags is null first.
    
    const { data: articles, error: fetchError } = await supabase
      .from('articles')
      .select('id, title, tags')
      .or('tags.is.null,tags.eq.{}') // Fetch if null OR empty array
      .order('created_at', { ascending: false })
      .limit(100);

    if (fetchError) {
      throw new Error(`Failed to fetch articles: ${fetchError.message}`);
    }

    if (!articles || articles.length === 0) {
      console.log('✅ No articles to tag.');
      return new Response(
        JSON.stringify({ message: 'No articles to tag', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${articles.length} articles...`);

    let updatedCount = 0;

    for (const article of articles) {
      const newTags = generateTagsFromTitle(article.title);
      
      // Always add 'Actualité' if no other tags found, or just leave empty?
      // User wanted specific tags. If empty, maybe we shouldn't force it in DB 
      // but let frontend handle default. 
      // However, to prevent re-processing, we should probably save something 
      // or just accept that empty tags means "analyzed but found nothing".
      // But our query selects empty tags, so we'd loop forever.
      // Let's add "Actualité" if nothing else found, so it's not empty anymore.
      
      if (newTags.length === 0) {
          newTags.push('Actualité');
      }

      if (newTags.length > 0) {
        const { error: updateError } = await supabase
          .from('articles')
          .update({ tags: newTags })
          .eq('id', article.id);

        if (updateError) {
          console.error(`Failed to update article ${article.id}:`, updateError);
        } else {
          updatedCount++;
        }
      }
    }

    return new Response(
      JSON.stringify({ 
          message: 'Auto-tagging completed', 
          processed: articles.length, 
          updated: updatedCount 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('❌ Error in auto-tagging:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
