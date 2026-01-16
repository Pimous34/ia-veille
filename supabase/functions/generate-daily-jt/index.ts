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
// Nettoie le texte pour la synthèse vocale (enlève les URLs et balises HTML sauf break)
function cleanTextForSpeech(text: string): string {
  if (!text) return '';
  return text
    .replace(/<(?!\/?break)[^>]*>/g, '') // Enlève les balises HTML complètes sauf <break>
    .replace(/[<>]/g, (match) => { return match === '<' || match === '>' ? match : ' ' }) // Garde les chevrons pour les tags valides, sinon nettoie
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

  // Récupérer le message du formateur
  const { data: messageData } = await supabase
      .from('daily_messages')
      .select('content')
      .eq('date', date)
      .single();

  const messageFormateur = messageData ? messageData.content : "";

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
  // 2. Récupérer et construire le Prompt Système
  let promptTemplate = '';
  
  /* 
  try {
    const { data: promptData, error: promptError } = await supabase
      .from('system_prompts')
      .select('content')
      .eq('id', 'jt_script_generation')
      .single();

    if (promptError || !promptData) {
      console.warn('⚠️ Could not fetch system prompt from DB, using fallback.', promptError);
    } else {
      promptTemplate = promptData.content;
      console.log('✅ Loaded system prompt from DB');
    }
  } catch (e) {
    console.warn('⚠️ Error fetching system prompt:', e);
  }
  */

  // Fallback si la DB échoue ou est vide
  if (!promptTemplate) {
    promptTemplate = `
Vous êtes un présentateur de journal télévisé (JT) IA, spécialisé dans la veille technologique et l'informatique, sous l'apparence de l'avatar d'un personnage célèbre de l'informatique. Votre style est sympathique, synthétique et engageant, avec une touche d'humanité et d'humour.

Votre tâche est de générer le script du flash info quotidien en utilisant **strictement** la structure de sortie JSON demandée ci-dessous.

---
### DONNÉES INJECTÉES PAR L'APPLICATION (à intégrer dans le JSON)
* NOM_PERSONNALITE : {{NOM_PERSONNALITE}}
* CONTRIBUTION_AVATAR : {{CONTRIBUTION_AVATAR}}
* NOM_UTILISATEUR : Chers Oreegamiens
* LIEU_BACKGROUND : {{LIEU_BACKGROUND}}
* DATE_DU_JOUR : {{DATE_DU_JOUR}}
* ARTICLES_SELECTIONNÉS : 
{{ARTICLES_LIST}}
* MESSAGE_FORMATEUR : {{MESSAGE_FORMATEUR}}
* AGENDA_DEMAIN : 
{{AGENDA_DEMAIN}}
* SCORE_JOURNAL : 95

### INSTRUCTION DE GÉNÉRATION DU SCRIPT

1.  **TONALITÉ :** Le ton général est **Ambiant/Amical**.
2.  **INTRODUCTION :** Saluez le public ("tous les Oreegamiens"), présentez-vous en tant que {{NOM_PERSONNALITE}} (avec votre {{CONTRIBUTION_AVATAR}}), et présentez le lieu où vous vous situez ({{LIEU_BACKGROUND}}), en expliquant brièvement sa contribution dans l'informatique.
3.  **MESSAGE DU FORMATEUR :** Insérez le message du formateur ici : "{{MESSAGE_FORMATEUR}}". Si le message est vide, passez cette étape. Annoncez-le comme un message important.
4.  **NEWS :** Pour chaque article, créez une description courte et vivante. Assurez des transitions fluides. Intégrez le **Chiffre Clé** le plus marquant de la journée pour ancrer l'information. S'il y a des personnalités célèbres mentionnées dans l'article, faites-y référence de manière pertinente.
5.  **AGENDA :** Faites une transition fluide vers l'agenda. Annoncez : "Demain nous allons faire...". Si la liste [AGENDA_DEMAIN] est vide et que la date du jour est Vendredi, concluez sur un bon week-end. Sinon, présentez l'agenda de manière succincte.
6.  **CONCLUSION/CTA :** Concluez par une note positive liée à l'apprentissage/entraide. Intégrez un appel à l'action invitant à utiliser une fonctionnalité de la plateforme (ex: "sauvegarder l'article le plus important").

### FORMAT DE SORTIE EXIGÉ (JSON STRICT)

\`\`\`json
{
  "metadata_jt": {
    "avatar_nom": "{{NOM_PERSONNALITE}}",
    "avatar_contribution_courte": "{{CONTRIBUTION_AVATAR}}",
    "background_lieu": "{{LIEU_BACKGROUND}}",
    "score_final": 95
  },
  "titre_journal": "Flash Info IA : [Sujet le plus marquant des 5 articles]",
  "introduction": "[Texte de bienvenue et de présentation fusionnant l'avatar et le lieu.]",
  "message_formateur": "[Le message du formateur reformulé si nécessaire, ou vide si aucun message]",
  "segments_news": [
    {
      "segment_id": 1,
      "texte": "[Texte du premier article. Intégrer l'alerte/le chiffre clé ici.]"
    },
    {
      "segment_id": 2,
      "texte": "[Texte de l'article 2. Assurer la transition.]"
    }
  ],
  "transition_agenda": "[Texte de transition fluide vers l'agenda.]",
  "agenda_texte": "[Présentation des événements ou message de week-end.]",
  "conclusion_finale": "[Note positive et Appel à l'Action spécifique à la fin.]"
}
\`\`\``;
  }

  // Remplacer les variables
  const systemPrompt = promptTemplate
    .replace(/{{NOM_PERSONNALITE}}/g, nomPersonnalite)
    .replace(/{{CONTRIBUTION_AVATAR}}/g, contributionAvatar)
    .replace(/{{LIEU_BACKGROUND}}/g, lieuBackground)
    .replace(/{{DATE_DU_JOUR}}/g, dateFormatted)
    .replace(/{{ARTICLES_LIST}}/g, articlesList)
    .replace(/{{AGENDA_DEMAIN}}/g, agendaDemain)
    .replace(/{{MESSAGE_FORMATEUR}}/g, messageFormateur);

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
    fullScript += jsonScript.introduction + ' <break time="1s" /> ';
    
    // Ajout du message formateur
    if (jsonScript.message_formateur && jsonScript.message_formateur.length > 5) {
        fullScript += jsonScript.message_formateur + ' <break time="1s" /> ';
    }
    
    if (jsonScript.segments_news && Array.isArray(jsonScript.segments_news)) {
        jsonScript.segments_news.forEach((seg: { texte: string }) => {
            fullScript += seg.texte + ' <break time="500ms" /> '; // Petite pause entre les news
        });
    }
    
    fullScript += ' <break time="1s" /> ' + jsonScript.transition_agenda + " ";
    fullScript += jsonScript.agenda_texte + ' <break time="1s" /> ';
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
async function createDIDVideo(_script: string, presenterImageUrl: string): Promise<DIDStatusResponse> {
  // Temporaire : hardcoder la clé pour tester
  // Updated key provided by user (Benjamin Rigouste)
  const dIdApiKey = 'Basic ' + btoa('YmVuamFtaW4ucmlnb3VzdGVAZ21haWwuY29t:CMjU9HelCOpjmwN87eEgj');
  
  if (!dIdApiKey) {
    throw new Error('D_ID_API_KEY not configured');
  }

  // Créer le talk avec D-ID
  const requestBody = {
    source_url: presenterImageUrl,
    script: {
      type: 'text',
      input: _script,
      provider: {
        type: 'microsoft',
        voice_id: 'fr-FR-VivienneMultilingualNeural', // Voix Vivienne Dragon HD Lat (Multilingual Neural)
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
  };

  console.log('🚀 Sending request to D-ID:', JSON.stringify(requestBody, null, 2));

  const response = await fetch('https://api.d-id.com/talks', {
    method: 'POST',
    headers: {
      'Authorization': dIdApiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ D-ID API Error Status: ${response.status} ${response.statusText}`);
    console.error(`❌ D-ID API Error Body: ${errorText}`);
    throw new Error(`D-ID API error: ${errorText}`);
  }

  const result = await response.json();
  console.log('✅ D-ID API Success:', JSON.stringify(result, null, 2));
  return result;
}

// Vérifie le statut d'une vidéo D-ID
async function checkDIDVideoStatus(talkId: string): Promise<DIDStatusResponse> {
  const dIdApiKey = 'Basic ' + btoa('YmVuamFtaW4ucmlnb3VzdGVAZ21haWwuY29t:CMjU9HelCOpjmwN87eEgj');
  
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
    // const fullPresenterImageUrl = 'https://jrlecaepyoivtplpvwoe.supabase.co/storage/v1/object/public/jt-assets/presenter/ophelie-leccia.jpg';
    const fullPresenterImageUrl = 'https://d-id-public-bucket.s3.amazonaws.com/alice.jpg';
    
    console.log(`Using presenter image: ${fullPresenterImageUrl}`);

    try {
      // Créer la vidéo avec D-ID
      console.log('📝 Script sent to D-ID:', script);
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
      // Mettre à jour avec l'URL de la vidéo finale
      const { data: updatedJT, error: updateError } = await supabase
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

      if (updateError) {
        console.error(`❌ Failed to update JT status to completed: ${updateError.message}`);
        throw new Error(`Failed to update JT status: ${updateError.message}`);
      }

      if (!updatedJT) {
        console.error('❌ Updated JT record is null, but no error reported. Partial update?');
        // On ne throw pas ici car la vidéo est générée et uploadée, c'est le plus important.
        // Mais on loggue l'anomalie.
      } else {
        console.log(`✅ JT completed and DB updated: ${finalVideoUrl}`);
      }

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
