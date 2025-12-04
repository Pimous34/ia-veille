// Edge Function: generate-daily-jt
// Génère un JT vidéo de 3 minutes avec D-ID à partir des articles sélectionnés
// Intègre le jingle vidéo avant chaque JT
// Appelé automatiquement après select-daily-news

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

console.log("Function generate-daily-jt loaded");

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

interface DIDStatusResponse {
  id: string;
  status: 'created' | 'started' | 'done' | 'error' | 'rejected';
  result_url?: string;
  source_url?: string;
  duration?: number;
  error?: unknown;
  [key: string]: unknown;
}

// Nettoie le texte pour la synthèse vocale (enlève les URLs et balises HTML)
function cleanTextForSpeech(text: string): string {
  if (!text) return '';
  return text
    .replace(/<[^>]*>/g, '') // Enlève les balises HTML complètes
    .replace(/[<>]/g, ' ') // Enlève les chevrons restants pour éviter l'interprétation SSML
    .replace(/https?:\/\/[^\s]+/g, '') // Enlève les URLs
    .replace(/&[a-z]+;/g, '') // Enlève les entités HTML basiques
    .replace(/\s+/g, ' ') // Normalise les espaces
    .trim();
}

// Génère le script du JT à partir des articles et du planning
async function generateJTScript(articles: Article[], date: string, supabase: SupabaseClient): Promise<string> {
  const dateObj = new Date(date);
  const dateFormatted = dateObj.toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  let script = `Bonjour et bienvenue dans votre journal de l'IA du ${dateFormatted}. `;

  // --- LOGIQUE PLANNING ---
  // Récupérer les événements du jour
  const startOfDay = new Date(dateObj);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(dateObj);
  endOfDay.setHours(23, 59, 59, 999);

  // Vérifier si c'est le week-end (Samedi = 6, Dimanche = 0)
  const dayOfWeek = dateObj.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  if (isWeekend) {
      script += `C'est le week-end ! Il est toujours intéressant de profiter de ces jours off pour développer ses connaissances et compétences. `;
  } else {
      const { data: events } = await supabase
          .from('planning_cours')
          .select('title, detected_topic, organizer_email')
          .gte('start_date', startOfDay.toISOString())
          .lte('start_date', endOfDay.toISOString());

      let hasAutonomyEvent = false;
      let specificTopic = null;
      let organizerName = null;

      if (events && events.length > 0) {
          console.log('📅 Events found for today:', events);
          for (const event of events) {
              const titleLower = event.title.toLowerCase();
              if (titleLower.includes('p auto') || titleLower.includes('hackaton') || titleLower.includes('fil rouge') || titleLower.includes('ia quick feed') || titleLower.includes('autonomie')) {
                  hasAutonomyEvent = true;
              }
              if (event.detected_topic) {
                  specificTopic = event.detected_topic;
                  // Essayer d'extraire le nom de l'organisateur depuis l'email
                  if (event.organizer_email) {
                      // Format attendu: prenom.nom@domaine.com
                      const emailParts = event.organizer_email.split('@')[0].split('.');
                      if (emailParts.length >= 2) {
                          // Capitalize first letters
                          const firstName = emailParts[0].charAt(0).toUpperCase() + emailParts[0].slice(1);
                          const lastName = emailParts[1].charAt(0).toUpperCase() + emailParts[1].slice(1);
                          organizerName = `${firstName} ${lastName}`;
                      }
                  }
              }
          }
      }

      if (hasAutonomyEvent) {
          script += `Aujourd'hui, c'est une journée en totale autonomie. Bon courage pour vos projets ! `;
          script += `N'oubliez pas que l'auto-formation est la clé pour devenir un excellent chef de projet digital. `;
          script += `Soyez curieux, testez de nouvelles solutions. `;
          script += `Je vous recommande vivement de suivre des chaînes comme Shubham Sharma, Micode, ou Underscore, qui sont des mines d'or pour rester à jour et motivé. `;
          script += `Prenez le temps chaque jour de faire votre veille, c'est indispensable. `;
      } else if (specificTopic) {
          script += `Aujourd'hui, focus sur ${specificTopic}. `;
          if (organizerName) {
              script += `Le cours sera assuré par ${organizerName}. `;
          }
          script += `Profitez de cette journée pour approfondir vos connaissances sur cet outil. `;
      } else {
          script += `J'espère que vous êtes en forme pour cette nouvelle journée. `;
      }
  }

  script += `Passons maintenant aux actualités de l'IA. `;
  script += `Nous avons sélectionné pour vous ${articles.length} sujets majeurs. `;
  script += `\n\n`;

  articles.forEach((article, index) => {
    const articleNumber = index + 1;
    
    // Introduction de l'article
    const cleanTitle = cleanTextForSpeech(article.title);
    script += `Sujet numéro ${articleNumber}. `;
    script += `${cleanTitle}. `;
    
    // Résumé de l'article
    if (article.excerpt) {
      // Nettoyer d'abord, puis limiter
      const cleanExcerpt = cleanTextForSpeech(article.excerpt);
      // Limiter l'extrait à ~150 caractères pour garder un rythme dynamique
      const shortExcerpt = cleanExcerpt.substring(0, 150).trim();
      script += `${shortExcerpt}${shortExcerpt.length >= 150 ? '...' : ''}. `;
    }
    
    script += `\n\n`;
  });

  script += `C'est tout pour aujourd'hui. `;
  if (hasAutonomyEvent) {
      script += `Allez, au travail, et montrez-nous de quoi vous êtes capables ! `;
  }
  script += `À demain pour un nouveau point sur l'actualité de l'intelligence artificielle !`;

  return script;
}

// Crée une vidéo avec D-ID
async function createDIDVideo(script: string, presenterImageUrl: string): Promise<DIDStatusResponse> {
  // Temporaire : hardcoder la clé pour tester
  const dIdApiKey = 'Basic YmVuamFtaW4ucmlnb3VzdGVAZ21haWwuY29t:fFfUrKUkym7Annpy8z2fp';
  
  if (!dIdApiKey) {
    throw new Error('D_ID_API_KEY not configured');
  }

  // Créer le talk avec D-ID
  const response = await fetch('https://api.d-id.com/talks', {
    method: 'POST',
    headers: {
      'Authorization': dIdApiKey,
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
async function checkDIDVideoStatus(talkId: string): Promise<DIDStatusResponse> {
  const dIdApiKey = 'Basic YmVuamFtaW4ucmlnb3VzdGVAZ21haWwuY29t:fFfUrKUkym7Annpy8z2fp';
  
  const response = await fetch(`https://api.d-id.com/talks/${talkId}`, {
    method: 'GET',
    headers: {
      'Authorization': dIdApiKey,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`D-ID API error: ${error}`);
  }

  return await response.json();
}

// Télécharge une vidéo depuis une URL
async function downloadVideo(url: string): Promise<Uint8Array> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download video: ${response.statusText}`);
  }
  return new Uint8Array(await response.arrayBuffer());
}

// Upload une vidéo vers Supabase Storage
async function uploadVideoToStorage(
  videoUrl: string,
  fileName: string,
  supabase: SupabaseClient
): Promise<string> {
  console.log('⬇️ Downloading video from D-ID...');
  const response = await fetch(videoUrl);
  if (!response.ok) {
    throw new Error(`Failed to download video: ${response.statusText}`);
  }
  const videoBlob = await response.blob();

  console.log('📤 Uploading video to Supabase Storage...');
  const { error: uploadError } = await supabase.storage
    .from('jt-assets')
    .upload(`videos/${fileName}`, videoBlob, {
      contentType: 'video/mp4',
      upsert: true,
    });

  if (uploadError) {
    throw new Error(`Failed to upload video: ${uploadError.message}`);
  }

  const { data: { publicUrl } } = supabase.storage
    .from('jt-assets')
    .getPublicUrl(`videos/${fileName}`);

  return publicUrl;
}

serve(async (req: Request) => {
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

    // Générer le script avec la logique de planning
    const script = await generateJTScript(articles, date, supabase);
    
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

    // URL de l'image du présentateur depuis Supabase Storage
    // IMPORTANT: Assurez-vous que cette image existe dans votre bucket 'jt-assets/presenter'
    const fullPresenterImageUrl = 'https://jrlecaepyoivtplpvwoe.supabase.co/storage/v1/object/public/jt-assets/presenter/ophelie-jt.jpg';
    
    console.log(`Using presenter image: ${fullPresenterImageUrl}`);

    try {
      // Créer la vidéo avec D-ID
      const didResponse = await createDIDVideo(script, fullPresenterImageUrl);
      
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
      let finalResult: DIDStatusResponse | null = null;

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

      if (!videoReady || !finalResult) {
        throw new Error('Video generation timeout');
      }

      console.log('✅ Video ready!');

      // Nom du fichier final
      const videoFileName = `jt_${date}_${didResponse.id}.mp4`;
      let finalVideoUrl = '';
      
      if (finalResult.result_url) {
        // Télécharger et uploader la vidéo D-ID sur Supabase Storage pour la persistance
        console.log('⬇️ Downloading and persisting D-ID Video...');
        finalVideoUrl = await uploadVideoToStorage(
          finalResult.result_url,
          videoFileName,
          supabase
        );
        console.log(`✅ Video uploaded to storage: ${finalVideoUrl}`);
      } else {
        throw new Error('No result URL from D-ID');
      }

      // Mettre à jour avec l'URL de la vidéo finale
      const { data: updatedJT } = await supabase
        .from('daily_news_videos')
        .update({
          video_url: finalVideoUrl,
          thumbnail_url: finalResult.source_url,
          duration: finalResult.duration,
          status: 'completed',
          completed_at: new Date().toISOString(),
          d_id_result: finalResult,
        })
        .eq('id', jtRecord.id)
        .select()
        .single();

      console.log(`✅ JT completed: ${finalVideoUrl}`);

      return new Response(
        JSON.stringify({
          message: 'JT generated successfully',
          jt: updatedJT,
          video_url: finalVideoUrl,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );

    } catch (didError: unknown) {
      console.error('❌ D-ID error:', didError);
      
      const errorMessage = didError instanceof Error ? didError.message : String(didError);

      // Mettre à jour le statut en échec
      await supabase
        .from('daily_news_videos')
        .update({
          status: 'failed',
          error_message: errorMessage,
        })
        .eq('id', jtRecord.id);

      throw didError;
    }

  } catch (error: unknown) {
    console.error('❌ Error in JT generation:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
