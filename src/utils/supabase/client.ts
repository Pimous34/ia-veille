import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error(`⚠️ CRITICAL: Supabase environment variables are missing! 
    - NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? 'Defined' : 'MISSING'}
    - NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseKey ? 'Defined' : 'MISSING'}
    
    👉 Please check your .env.local file.
    👉 IF YOU JUST CREATED .env.local, YOU MUST RESTART THE DEV SERVER (Ctrl+C then npm run dev).`);
    
    // Return a dummy client to prevent crash, requests will just fail (and be caught)
    return createBrowserClient(
      'https://placeholder-project.supabase.co',
      'placeholder-key'
    );
  }

  return createBrowserClient(supabaseUrl, supabaseKey)
}
