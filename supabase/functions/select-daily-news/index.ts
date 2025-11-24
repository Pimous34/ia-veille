// Edge Function: select-daily-news
// Sélectionne les articles les plus pertinents de la journée pour le JT
// Triggered by Supabase Cron daily at 18:00

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Article {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  url: string;
  image_url: string;
  published_at: string;
  view_count: number;
  category_id: string;
  source_id: string;
}

// Calcule un score de pertinence pour un article
function calculateRelevanceScore(article: Article, now: Date): number {
  let score = 0;
  
  // 1. Fraîcheur (0-40 points) - Plus récent = meilleur
  const publishedAt = new Date(article.published_at);
  const hoursSincePublished = (now.getTime() - publishedAt.getTime()) / (1000 * 60 * 60);
  
  if (hoursSincePublished <= 6) score += 40;
  else if (hoursSincePublished <= 12) score += 30;
  else if (hoursSincePublished <= 24) score += 20;
  else if (hoursSincePublished <= 48) score += 10;
  
  // 2. Engagement (0-30 points) - Basé sur les vues
  const viewScore = Math.min(30, (article.view_count / 10) * 5);
  score += viewScore;
  
  // 3. Qualité du contenu (0-20 points)
  const hasImage = article.image_url ? 10 : 0;
  const contentLength = article.content?.length || 0;
  const contentQuality = contentLength > 500 ? 10 : contentLength > 200 ? 5 : 0;
  score += hasImage + contentQuality;
  
  // 4. Titre accrocheur (0-10 points)
  const titleKeywords = ['nouveau', 'révolution', 'innovation', 'découverte', 'important', 'majeur', 'exclusif'];
  const titleLower = article.title.toLowerCase();
  const hasKeyword = titleKeywords.some(keyword => titleLower.includes(keyword));
  if (hasKeyword) score += 10;
  
  return Math.min(100, score);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🎯 Starting daily news selection...');

    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const today = now.toISOString().split('T')[0];

    // Réinitialiser les marqueurs is_daily_news précédents
    await supabase
      .from('articles')
      .update({ is_daily_news: false })
      .eq('is_daily_news', true);

    // Récupérer les articles des dernières 24h
    const { data: articles, error: articlesError } = await supabase
      .from('articles')
      .select('*')
      .gte('published_at', yesterday.toISOString())
      .order('published_at', { ascending: false });

    if (articlesError) {
      throw new Error(`Failed to fetch articles: ${articlesError.message}`);
    }

    if (!articles || articles.length === 0) {
      console.log('⚠️ No articles found for today');
      return new Response(
        JSON.stringify({ message: 'No articles found', selected_count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📊 Analyzing ${articles.length} articles...`);

    // Calculer les scores de pertinence
    const scoredArticles = articles.map((article: Article) => ({
      ...article,
      relevance_score: calculateRelevanceScore(article, now),
    }));

    // Trier par score décroissant
    scoredArticles.sort((a, b) => b.relevance_score - a.relevance_score);

    // Sélectionner les 5-7 meilleurs articles (pour un JT de ~3 minutes)
    // Environ 25-30 secondes par article
    const selectedArticles = scoredArticles.slice(0, 6);

    console.log(`✅ Selected ${selectedArticles.length} articles for daily news`);

    // Mettre à jour les articles sélectionnés
    for (const article of selectedArticles) {
      await supabase
        .from('articles')
        .update({
          is_daily_news: true,
          daily_news_date: today,
          relevance_score: article.relevance_score,
        })
        .eq('id', article.id);
    }

    // Déclencher la génération de la vidéo
    const generateVideoUrl = `${supabaseUrl}/functions/v1/generate-daily-jt`;
    const generateResponse = await fetch(generateVideoUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        date: today,
        article_ids: selectedArticles.map(a => a.id),
      }),
    });

    const generateResult = await generateResponse.json();

    return new Response(
      JSON.stringify({
        message: 'Daily news selection completed',
        selected_count: selectedArticles.length,
        articles: selectedArticles.map(a => ({
          id: a.id,
          title: a.title,
          score: a.relevance_score,
        })),
        video_generation: generateResult,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('❌ Error in daily news selection:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
