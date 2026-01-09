import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

  return createBrowserClient(
    supabaseUrl,
    supabaseKey,
    {
      auth: {
        // Configuration pour la persistance de session
        persistSession: true, // Active la persistance de session
        storageKey: 'ia-veille-auth', // Clé de stockage personnalisée
        storage: typeof window !== 'undefined' ? window.localStorage : undefined, // Utilise localStorage
        autoRefreshToken: true, // Rafraîchit automatiquement le token
        detectSessionInUrl: true, // Détecte la session dans l'URL (pour OAuth)
      },
    }
  );
}
