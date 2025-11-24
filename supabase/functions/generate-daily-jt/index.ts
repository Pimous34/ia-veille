// Edge Function: generate-daily-jt
// Génère un JT vidéo de 3 minutes avec D-ID à partir des articles sélectionnés
// Appelé automatiquement après select-daily-news

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
  image_url: string;
  url: string;
  published_at: string;
}

// Génère le script du JT à partir des articles
function generateJTScript(articles: Article[], date: string): string {
  const dateFormatted = new Date(date).toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  let script = `Bonjour et bienvenue dans votre journal de l'IA du ${dateFormatted}. `;
  script += `Aujourd'hui, nous avons sélectionné pour vous ${articles.length} actualités majeures dans le monde de l'intelligence artificielle. `;
  script += `\n\n`;

  articles.forEach((article, index) => {
    const articleNumber = index + 1;
    
    // Introduction de l'article
    script += `Article numéro ${articleNumber}. `;
    script += `${article.title}. `;
    
    // Résumé de l'article
    if (article.excerpt) {
      // Limiter l'extrait à ~150 caractères pour garder un rythme dynamique
      const shortExcerpt = article.excerpt.substring(0, 150).trim();
      script += `${shortExcerpt}${shortExcerpt.length >= 150 ? '...' : ''}. `;
    }
    
    script += `\n\n`;
  });

  script += `Voilà pour les actualités du jour. `;
  script += `Retrouvez tous ces articles en détail sur notre plateforme. `;
  script += `À très bientôt pour de nouvelles actualités de l'intelligence artificielle !`;

  return script;
}

// Crée une vidéo avec D-ID
async function createDIDVideo(script: string, presenterImageUrl: string): Promise<any> {
  const dIdApiKey = Deno.env.get('D_ID_API_KEY');
  
  if (!dIdApiKey) {
    throw new Error('D_ID_API_KEY not configured');
  }

  // Créer le talk avec D-ID
  const response = await fetch('https://api.d-id.com/talks', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${dIdApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      source_url: presenterImageUrl,
      script: {
        type: 'text',
        input: script,
        provider: {
          type: 'microsoft',
          voice_id: 'fr-FR-DeniseNeural', // Voix française féminine professionnelle
        },
      },
      config: {
        result_format: 'mp4',
        fluent: true,
        pad_audio: 0,
        stitch: true, // Pour combiner plusieurs segments si nécessaire
        driver_expressions: {
          expressions: [
            { start_frame: 0, expression: 'neutral', intensity: 1.0 },
          ],
        },
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`D-ID API error: ${error}`);
  }

  return await response.json();
}

// Vérifie le statut d'une vidéo D-ID
async function checkDIDVideoStatus(talkId: string): Promise<any> {
  const dIdApiKey = Deno.env.get('D_ID_API_KEY');
  
  const response = await fetch(`https://api.d-id.com/talks/${talkId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Basic ${dIdApiKey}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`D-ID API error: ${error}`);
  }

  return await response.json();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { date, article_ids } = await req.json();

    console.log(`🎬 Starting JT generation for ${date}...`);

    // Vérifier si un JT existe déjà pour cette date
    const { data: existingJT } = await supabase
      .from('daily_news_videos')
      .select('*')
      .eq('date', date)
      .single();

    if (existingJT && existingJT.status === 'completed') {
      console.log('✅ JT already exists for this date');
      return new Response(
        JSON.stringify({ message: 'JT already exists', jt: existingJT }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Récupérer les articles sélectionnés
    const { data: articles, error: articlesError } = await supabase
      .from('articles')
      .select('id, title, excerpt, image_url, url, published_at')
      .in('id', article_ids)
      .order('relevance_score', { ascending: false });

    if (articlesError || !articles || articles.length === 0) {
      throw new Error('Failed to fetch selected articles');
    }

    console.log(`📝 Generating script for ${articles.length} articles...`);

    // Générer le script
    const script = generateJTScript(articles, date);
    const title = `JT IA - ${new Date(date).toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    })}`;

    // Créer l'entrée dans la base de données
    const { data: jtRecord, error: jtError } = await supabase
      .from('daily_news_videos')
      .upsert({
        date,
        title,
        script,
        article_ids,
        status: 'processing',
      })
      .select()
      .single();

    if (jtError) {
      throw new Error(`Failed to create JT record: ${jtError.message}`);
    }

    console.log('🎥 Creating video with D-ID...');

    // URL de l'image du présentateur (à configurer)
    const presenterImageUrl = Deno.env.get('JT_PRESENTER_IMAGE_URL') || 
      'https://create-images-results.d-id.com/default_presenter.jpg';

    try {
      // Créer la vidéo avec D-ID
      const didResponse = await createDIDVideo(script, presenterImageUrl);
      
      console.log(`✅ D-ID talk created: ${didResponse.id}`);

      // Mettre à jour avec l'ID D-ID
      await supabase
        .from('daily_news_videos')
        .update({
          d_id_talk_id: didResponse.id,
          status: 'processing',
        })
        .eq('id', jtRecord.id);

      // Attendre que la vidéo soit prête (polling)
      let attempts = 0;
      const maxAttempts = 60; // 5 minutes max (5 secondes * 60)
      let videoReady = false;
      let finalResult: any = null;

      while (attempts < maxAttempts && !videoReady) {
        await new Promise(resolve => setTimeout(resolve, 5000)); // Attendre 5 secondes
        
        const status = await checkDIDVideoStatus(didResponse.id);
        console.log(`📊 Video status: ${status.status} (attempt ${attempts + 1}/${maxAttempts})`);

        if (status.status === 'done') {
          videoReady = true;
          finalResult = status;
        } else if (status.status === 'error' || status.status === 'rejected') {
          throw new Error(`D-ID video generation failed: ${status.error || 'Unknown error'}`);
        }

        attempts++;
      }

      if (!videoReady) {
        throw new Error('Video generation timeout');
      }

      console.log('✅ Video ready!');

      // Mettre à jour avec l'URL de la vidéo
      const { data: updatedJT } = await supabase
        .from('daily_news_videos')
        .update({
          video_url: finalResult.result_url,
          thumbnail_url: finalResult.source_url,
          duration: finalResult.duration,
          status: 'completed',
          completed_at: new Date().toISOString(),
          d_id_result: finalResult,
        })
        .eq('id', jtRecord.id)
        .select()
        .single();

      return new Response(
        JSON.stringify({
          message: 'JT generated successfully',
          jt: updatedJT,
          video_url: finalResult.result_url,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );

    } catch (didError) {
      console.error('❌ D-ID error:', didError);
      
      // Mettre à jour le statut en échec
      await supabase
        .from('daily_news_videos')
        .update({
          status: 'failed',
          error_message: didError.message,
        })
        .eq('id', jtRecord.id);

      throw didError;
    }

  } catch (error) {
    console.error('❌ Error in JT generation:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
