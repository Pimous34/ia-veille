// Initialisation du client Supabase
// Nécessite que la librairie supabase-js soit chargée avant ce script

let _supabase;

if (typeof supabase === 'undefined') {
    console.error('La librairie Supabase n\'est pas chargée.');
} else if (typeof SUPABASE_URL === 'undefined' || SUPABASE_URL === 'VOTRE_SUPABASE_URL_ICI') {
    console.warn('Veuillez configurer SUPABASE_URL et SUPABASE_ANON_KEY dans js/supabase-config.js');
} else {
    _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('Supabase client initialized');
}
