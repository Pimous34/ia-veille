
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    try {
        console.log('Querying Supabase...');
        const { count, error } = await supabase
            .from('events')
            .select('*', { count: 'exact', head: true });

        if (error) {
            console.error('Error:', error.message);
        } else {
            console.log('Exact count:', count);
        }
    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

run();
