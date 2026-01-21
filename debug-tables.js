
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
    console.log('Checking tables in Supabase...');

    // Try events (plural)
    const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .limit(1);

    if (eventsError) {
        console.log('Table "events" (plural) error:', eventsError.message);
    } else {
        console.log('Table "events" (plural) exists.');
    }

    // Try event (singular)
    const { data: eventData, error: eventError } = await supabase
        .from('event')
        .select('*')
        .limit(1);

    if (eventError) {
        console.log('Table "event" (singular) error:', eventError.message);
    } else {
        console.log('Table "event" (singular) exists.');
    }
}

checkTables();
