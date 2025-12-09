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

    let candidateArticles = articles || [];

    // Fallback: Si pas d'articles frais (24h), on regarde sur 72h (Week-end / Jours fériés)
    if (candidateArticles.length === 0) {
      console.log('⚠️ No articles found for last 24h. Trying fallback (last 72h)...');
      const threeDaysAgo = new Date(now.getTime() - 72 * 60 * 60 * 1000);
      
      const { data: fallbackArticles, error: fallbackError } = await supabase
        .from('articles')
        .select('*')
        .gte('published_at', threeDaysAgo.toISOString())
        .order('published_at', { ascending: false });

      if (!fallbackError && fallbackArticles && fallbackArticles.length > 0) {
        console.log(`✅ Fallback successful: found ${fallbackArticles.length} articles from last 3 days.`);
        candidateArticles = fallbackArticles;
      }
    }

    if (candidateArticles.length === 0) {
      console.log('❌ No articles found even after fallback.');
      return new Response(
        JSON.stringify({ message: 'No articles found (checked last 72h)', selected_count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📊 Analyzing ${articles.length} articles...`);

    // 0. Regrouper les articles similaires (Clustering basique par titre)
    // On considère que si > 50% des mots du titre sont communs, c'est le même sujet
    const clusters: { [key: string]: Article[] } = {};
    const processedIds = new Set<string>();

    for (const article of candidateArticles) {
      if (processedIds.has(article.id)) continue;

      // Créer un nouveau cluster avec cet article comme chef de file
      const clusterId = article.id;
      clusters[clusterId] = [article];
      processedIds.add(article.id);

      const titleWords = article.title.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3);

      // Chercher des articles similaires dans le reste de la liste
      for (const otherArticle of candidateArticles) {
        if (processedIds.has(otherArticle.id)) continue;

        const otherTitleWords = otherArticle.title.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3);
        
        // Compter les mots communs
        const commonWords = titleWords.filter((w: string) => otherTitleWords.includes(w));
        const similarity = commonWords.length / Math.max(titleWords.length, otherTitleWords.length);

        // Seuil de similarité (ex: 40% de mots communs)
        if (similarity > 0.4) {
          clusters[clusterId].push(otherArticle);
          processedIds.add(otherArticle.id);
        }
      }
    }

    console.log(`🧩 Grouped ${candidateArticles.length} articles into ${Object.keys(clusters).length} clusters`);

    // Calculer les scores de pertinence pour chaque cluster
    // Le score d'un cluster est le score du meilleur article + bonus de popularité (taille du cluster)
    const scoredClusters = Object.values(clusters).map(clusterArticles => {
      // Trouver le meilleur article du cluster (le plus complet/récent)
      // On score chaque article individuellement d'abord
      const scoredClusterArticles = clusterArticles.map(a => ({
        ...a,
        base_score: calculateRelevanceScore(a, now)
      }));
      
      // Trier pour trouver le "représentant" du cluster
      scoredClusterArticles.sort((a, b) => b.base_score - a.base_score);
      const representative = scoredClusterArticles[0];

      // Bonus de "Buzz" : +15 points par doublon (max 45 points)
      // Si 3 sources en parlent, c'est probablement important !
      const buzzBonus = Math.min(45, (clusterArticles.length - 1) * 15);
      
      return {
        ...representative,
        relevance_score: representative.base_score + buzzBonus, // Use 'relevance_score' to match expected property later
        cluster_size: clusterArticles.length
      };
    });

    // Trier les clusters par score final décroissant
    scoredClusters.sort((a, b) => b.relevance_score - a.relevance_score);

    // Sélectionner les 5-7 meilleurs sujets
    const selectedArticles = scoredClusters.slice(0, 6);

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
    // Utiliser la clé service role fournie par l'utilisateur pour contourner les problèmes d'env
    // Utiliser la variable d'environnement au lieu d'une clé hardcodée
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!serviceRoleKey) {
      console.error('❌ SUPABASE_SERVICE_ROLE_KEY is missing!');
      throw new Error('Internal configuration error: missing service role key');
    }
    
    console.log(`🚀 Triggering video generation at ${generateVideoUrl}`);
    
    const generateResponse = await fetch(generateVideoUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        date: today,
        article_ids: selectedArticles.map(a => a.id),
      }),
    });

    if (!generateResponse.ok) {
      const errorText = await generateResponse.text();
      console.error(`❌ Error triggering generate-daily-jt: ${generateResponse.status} ${generateResponse.statusText}`);
      console.error(`❌ Error details: ${errorText}`);
      throw new Error(`Failed to trigger generate-daily-jt: ${generateResponse.status} ${errorText}`);
    }

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
      JSON.stringify({ error: (error as Error).message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
