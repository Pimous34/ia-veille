// Edge Function: upload-jt-assets
// Upload l'image du présentateur et le jingle vidéo sur Supabase Storage

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('📤 Uploading JT assets to Supabase Storage...');

    // Créer le bucket s'il n'existe pas
    const { data: buckets } = await supabase.storage.listBuckets();
    const jtAssetsBucket = buckets?.find(b => b.name === 'jt-assets');
    
    if (!jtAssetsBucket) {
      await supabase.storage.createBucket('jt-assets', {
        public: true,
        fileSizeLimit: 52428800, // 50MB
      });
      console.log('✅ Bucket jt-assets created');
    }

    // Upload de l'image du présentateur
    const presenterImagePath = 'D:\\Ai Quick Feed\\ia-veille\\public\\image\\Gretta JT.jpg';
    const presenterImageFile = await Deno.readFile(presenterImagePath);
    
    const { data: presenterUpload, error: presenterError } = await supabase.storage
      .from('jt-assets')
      .upload('presenter/gretta-jt.jpg', presenterImageFile, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (presenterError) {
      throw new Error(`Failed to upload presenter image: ${presenterError.message}`);
    }

    // Obtenir l'URL publique de l'image
    const { data: presenterUrlData } = supabase.storage
      .from('jt-assets')
      .getPublicUrl('presenter/gretta-jt.jpg');

    console.log(`✅ Presenter image uploaded: ${presenterUrlData.publicUrl}`);

    // Upload du jingle vidéo
    const jingleVideoPath = 'D:\\Ai Quick Feed\\ia-veille\\public\\video\\Jingle.mp4';
    const jingleVideoFile = await Deno.readFile(jingleVideoPath);
    
    const { data: jingleUpload, error: jingleError } = await supabase.storage
      .from('jt-assets')
      .upload('jingle/jingle.mp4', jingleVideoFile, {
        contentType: 'video/mp4',
        upsert: true,
      });

    if (jingleError) {
      throw new Error(`Failed to upload jingle video: ${jingleError.message}`);
    }

    // Obtenir l'URL publique du jingle
    const { data: jingleUrlData } = supabase.storage
      .from('jt-assets')
      .getPublicUrl('jingle/jingle.mp4');

    console.log(`✅ Jingle video uploaded: ${jingleUrlData.publicUrl}`);

    return new Response(
      JSON.stringify({
        message: 'Assets uploaded successfully',
        presenterImageUrl: presenterUrlData.publicUrl,
        jingleVideoUrl: jingleUrlData.publicUrl,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('❌ Error uploading assets:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
