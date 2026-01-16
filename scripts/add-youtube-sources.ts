
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jrlecaepyoivtplpvwoe.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('SUPABASE_SERVICE_ROLE_KEY is required');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const newSources = [
  {
    name: 'Underscore_',
    url: 'https://www.youtube.com/@Underscore_talk', // URL approximative pour l'UI, pas critique
    rss_url: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCe0P7x_R8t_pT-kCj7vGzZw',
    type: 'rss',
    is_active: true
  },
  {
    name: 'Micode',
    url: 'https://www.youtube.com/@Micode',
    rss_url: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCyidG0K9y_O6iJ-r06uV6tg',
    type: 'rss',
    is_active: true
  }
];

async function addSources() {
  console.log('Adding YouTube RSS sources...');
  
  for (const source of newSources) {
    const { data: existing, error: checkError } = await supabase
        .from('sources')
        .select('id')
        .eq('rss_url', source.rss_url)
        .single();

    if (existing) {
        console.log(`Source already exists: ${source.name}`);
        continue;
    }

    const { data, error } = await supabase
      .from('sources')
      .insert([source])
      .select();

    if (error) {
      console.error(`Error adding ${source.name}:`, error.message);
    } else {
      console.log(`Successfully added source: ${source.name}`, data);
    }
  }
}

addSources();
