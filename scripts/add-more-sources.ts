
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://pjiobifgcvdapikurlbn.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqaW9iaWZnY3ZkYXBpa3VybGJuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTEwMjQ4MSwiZXhwIjoyMDgwNjc4NDgxfQ.TDVP4swScKmcyyrn9e3iXMRjEEiwQsSooGqpX70imEA';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const newSources = [
  {
    name: 'Ludovic Salenne',
    url: 'https://www.youtube.com/channel/UCnnYqSNKKygemgmxC9PyLTw',
    rss_url: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCnnYqSNKKygemgmxC9PyLTw',
    type: 'rss',
    is_active: true
  },
  {
    name: 'GEEK CONCEPT',
    url: 'https://www.youtube.com/channel/UCM7z7sRk383SZUTvqx0Yx2Q',
    rss_url: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCM7z7sRk383SZUTvqx0Yx2Q',
    type: 'rss',
    is_active: true
  }
];

async function addSources() {
  console.log('Adding New YouTube RSS sources...');
  
  for (const source of newSources) {
    const { data: existing, error: checkError } = await supabase
        .from('sources')
        .select('id')
        .eq('rss_url', source.rss_url)
        .single();

    if (existing) {
        console.log(`Source already exists: ${source.name} (ID: ${existing.id})`);
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
