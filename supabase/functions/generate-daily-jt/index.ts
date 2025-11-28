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
    const cleanTitle = cleanTextForSpeech(article.title);
    script += `Article numéro ${articleNumber}. `;
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

  script += `Voilà pour les actualités du jour. `;
  script += `Retrouvez tous ces articles en détail sur notre plateforme. `;
  script += `À très bientôt pour de nouvelles actualités de l'intelligence artificielle !`;

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



// Concatène le jingle avec la vidéo principale et upload sur Supabase Storage
export async function _mergeVideosAndUpload(
  jingleUrl: string,
  mainVideoUrl: string,
  outputFileName: string,
  supabase: SupabaseClient
): Promise<string> {
  console.log('🎬 Downloading jingle video...');
  const jingleData = await downloadVideo(jingleUrl);
  
  console.log('🎬 Downloading main video...');
  const mainVideoData = await downloadVideo(mainVideoUrl);
  
  // Créer des fichiers temporaires
  const jinglePath = `/tmp/jingle_${Date.now()}.mp4`;
  const mainVideoPath = `/tmp/main_${Date.now()}.mp4`;
  const outputPath = `/tmp/output_${Date.now()}.mp4`;
  const concatListPath = `/tmp/concat_${Date.now()}.txt`;
  
  await Deno.writeFile(jinglePath, jingleData);
  await Deno.writeFile(mainVideoPath, mainVideoData);
  
  // Créer le fichier de liste pour ffmpeg concat
  const concatList = `file '${jinglePath}'\nfile '${mainVideoPath}'`;
  await Deno.writeTextFile(concatListPath, concatList);
  
  console.log('🎬 Merging videos with FFmpeg...');
  
  // Utiliser FFmpeg pour concaténer les vidéos
  const ffmpegProcess = new Deno.Command('ffmpeg', {
    args: [
      '-f', 'concat',
      '-safe', '0',
      '-i', concatListPath,
      '-c', 'copy',
      '-y',
      outputPath
    ],
    stdout: 'piped',
    stderr: 'piped',
  });
  
  const { code, stderr } = await ffmpegProcess.output();
  
  if (code !== 0) {
    const errorText = new TextDecoder().decode(stderr);
    console.error('FFmpeg error:', errorText);
    throw new Error(`FFmpeg failed with code ${code}`);
  }
  
  console.log('✅ Videos merged successfully');
  
  // Lire le fichier de sortie
  const mergedVideoData = await Deno.readFile(outputPath);
  
  // Upload sur Supabase Storage
  console.log('📤 Uploading merged video to Supabase Storage...');
  const { error: uploadError } = await supabase.storage
    .from('jt-assets')
    .upload(`videos/${outputFileName}`, mergedVideoData, {
      contentType: 'video/mp4',
      upsert: true,
    });
  
  if (uploadError) {
    throw new Error(`Failed to upload merged video: ${uploadError.message}`);
  }
  
  // Obtenir l'URL publique
  const { data: urlData } = supabase.storage
    .from('jt-assets')
    .getPublicUrl(`videos/${outputFileName}`);
  
  // Nettoyer les fichiers temporaires
  try {
    await Deno.remove(jinglePath);
    await Deno.remove(mainVideoPath);
    await Deno.remove(outputPath);
    await Deno.remove(concatListPath);
  } catch (e) {
    console.warn('Warning: Failed to clean up temp files:', e);
  }
  
  console.log(`✅ Merged video uploaded: ${urlData.publicUrl}`);
  return urlData.publicUrl;
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

    // URL de l'image du présentateur depuis Supabase Storage
    const fullPresenterImageUrl = 'https://jrlecaepyoivtplpvwoe.supabase.co/storage/v1/object/public/jt-assets/presenter/gretta-jt.jpg';
    
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

      // URL du jingle (sera géré par le frontend)
      // const jingleUrl = 'https://jrlecaepyoivtplpvwoe.supabase.co/storage/v1/object/public/jt-assets/assets/jingle.mp4';
      
      // Nom du fichier final
      const videoFileName = `jt_${date}_${didResponse.id}.mp4`;
      let finalVideoUrl = '';
      
      if (finalResult.result_url) {
        // Télécharger et uploader la vidéo D-ID sur Supabase Storage pour la persistance
        // Note: La fusion avec le jingle se fera côté client car ffmpeg n'est pas dispo sur Edge Runtime
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
