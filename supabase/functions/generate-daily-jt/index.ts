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

// Appel à l'API Gemini pour générer le script
async function generateScriptWithGemini(
  articles: Article[], 
  date: string, 
  supabase: SupabaseClient
): Promise<string> {
  const GEMINI_API_KEY = 'AIzaSyDJxCanT0LzBpeZw2XTZ8oBSxN59O80RKs';
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

  // 1. Préparer les données de contexte
  const dateObj = new Date(date);
  const dateFormatted = dateObj.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  
  // Récupérer le planning (Agenda)
  const startOfDay = new Date(dateObj); startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(dateObj); endOfDay.setHours(23, 59, 59, 999);
  
  const { data: events } = await supabase
      .from('planning_cours')
      .select('title, start_date')
      .gte('start_date', startOfDay.toISOString())
      .lte('start_date', endOfDay.toISOString());

  const agendaDemain = events && events.length > 0 
      ? events.map(e => `- ${e.title} à ${new Date(e.start_date).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}`).join('\n')
      : "Aucun événement majeur prévu.";

  // Récupérer un lieu et une personnalité (Simulé pour l'instant ou récupéré depuis la DB si implémenté)
  // Pour l'instant on utilise Ophélie comme demandé précédemment, mais le prompt demande une célébrité.
  // On va adapter pour utiliser Ophélie Leccia comme "Avatar" principal.
  const nomPersonnalite = "Ophélie Leccia";
  const contributionAvatar = "Déléguée naturelle du groupe PBNC et experte autodidacte en automatisation (Make/n8n)";
  const lieuBackground = "Bureaux d'Oreegami Paris, Centre de formation dans les nouvelles technologies de l'IA, créé par Yann Gabay";

  // Préparer la liste des articles pour le prompt
  const articlesList = articles.map((a, i) => 
      `Article ${i+1}:
      - Titre: ${a.title}
      - Résumé: ${a.excerpt || 'Pas de résumé'}
      - Source: ${a.url}`
  ).join('\n\n');

  // 2. Construire le Prompt Système complet
  const systemPrompt = `
Vous êtes un présentateur de journal télévisé (JT) IA, spécialisé dans la veille technologique et l'informatique, sous l'apparence de l'avatar de ${nomPersonnalite}. Votre style est sympathique, synthétique et engageant, avec une touche d'humanité et d'humour.

Votre tâche est de générer le script du flash info quotidien en utilisant **strictement** la structure de sortie JSON demandée ci-dessous.

### DONNÉES INJECTÉES
* NOM_PERSONNALITE : ${nomPersonnalite}
* CONTRIBUTION_AVATAR : ${contributionAvatar}
* NOM_UTILISATEUR : Chers Oreegamiens
* LIEU_BACKGROUND : ${lieuBackground}
* DATE_DU_JOUR : ${dateFormatted}
* ARTICLES_SELECTIONNÉS : 
${articlesList}
* AGENDA_DEMAIN : 
${agendaDemain}

### INSTRUCTION DE GÉNÉRATION DU SCRIPT
1.  **TONALITÉ :** Le ton général est **Ambiant/Amical**.
2.  **INTRODUCTION :** Saluez le public ("tous les Oreegamiens"), présentez-vous en tant que ${nomPersonnalite} (avec votre contribution), et présentez le lieu (${lieuBackground}).
3.  **NEWS :** Pour chaque article, créez une description courte et vivante. Assurez des transitions fluides. Intégrez le **Chiffre Clé** le plus marquant si disponible.
4.  **NETTOYAGE AUDIO :** Ne prononcez JAMAIS les URL (ex: "http..."), les identifiants techniques (ex: "ID 404"), ou les noms de fichiers. Remplacez-les par des descriptions naturelles (ex: "sur le site officiel", "dans le rapport").
5.  **AGENDA :** Faites une transition fluide vers l'agenda.
6.  **CONCLUSION/CTA :** Concluez par une note positive liée à l'apprentissage/entraide.

### FORMAT DE SORTIE EXIGÉ (JSON STRICT, pas de markdown autour)
{
  "metadata_jt": {
    "avatar_nom": "String",
    "avatar_contribution_courte": "String",
    "background_lieu": "String",
    "score_final": 85
  },
  "titre_journal": "String",
  "introduction": "String",
  "segments_news": [
    { "segment_id": 1, "texte": "String" }
  ],
  "transition_agenda": "String",
  "agenda_texte": "String",
  "conclusion_finale": "String"
}`;

  // 3. Appeler Gemini
  console.log('🤖 Calling Gemini API...');
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: systemPrompt }]
      }],
      generationConfig: {
        temperature: 0.7,
        responseMimeType: "application/json"
      }
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API Error: ${response.status} - ${errText}`);
  }

  const data = await response.json();
  const generatedText = data.candidates[0].content.parts[0].text;

  // 4. Parser le JSON et reconstruire le script linéaire pour D-ID
  try {
    const jsonScript = JSON.parse(generatedText);
    
    let fullScript = "";
    fullScript += jsonScript.introduction + " ";
    
    if (jsonScript.segments_news && Array.isArray(jsonScript.segments_news)) {
        jsonScript.segments_news.forEach((seg: { texte: string }) => {
            fullScript += seg.texte + " ";
        });
    }
    
    fullScript += jsonScript.transition_agenda + " ";
    fullScript += jsonScript.agenda_texte + " ";
    fullScript += jsonScript.conclusion_finale;

    return cleanTextForSpeech(fullScript);

  } catch (error) {
    console.error("Failed to parse Gemini JSON response:", error);
    // Fallback: retourner le texte brut si le parsing échoue (peu probable avec responseMimeType)
    return cleanTextForSpeech(generatedText);
  }
}

// Wrapper pour garder la compatibilité avec l'appel existant
async function generateJTScript(articles: Article[], date: string, supabase: SupabaseClient): Promise<string> {
    return await generateScriptWithGemini(articles, date, supabase);
}

// Crée une vidéo avec D-ID
async function createDIDVideo(script: string, presenterImageUrl: string): Promise<DIDStatusResponse> {
  // Temporaire : hardcoder la clé pour tester
  const dIdApiKey = 'Basic YmVuamkubXRwQGdtYWlsLmNvbQ:--Rk4AbY8ppnYwnewyw0c';
  
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
  const dIdApiKey = 'Basic YmVuamkubXRwQGdtYWlsLmNvbQ:--Rk4AbY8ppnYwnewyw0c';
  
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
    const fullPresenterImageUrl = 'https://jrlecaepyoivtplpvwoe.supabase.co/storage/v1/object/public/jt-assets/presenter/ophelie-leccia.jpg';
    
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
