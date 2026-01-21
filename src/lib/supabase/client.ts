import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase env vars missing!', { supabaseUrl, supabaseKey });
  }

  return createBrowserClient(
    supabaseUrl!,
    supabaseKey!,
    {
      // Remove manual storage config to allow cookie-based auth share with server
    }
  );
}
