
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function assignAllCards() {
  console.log('Fetching all templates and users...');

  // 1. Get all templates
  const { data: templates, error: tplError } = await supabase
    .from('flashcard_templates')
    .select('id');

  if (tplError || !templates) {
    console.error('Error fetching templates:', tplError);
    return;
  }

  // 2. Get the first user (assuming single user dev env for now, or you can specify email)
  // Since we can't easily list users with simple client without admin rights in some setups, 
  // we might need the user ID. 
  // BUT, 'auth.users' is not accessible via standard client usually.
  // We will assume the script is run with SERVICE_ROLE_KEY which permits admin actions if needed,
  // or we ask the user to provide their ID.
  
  // Alternative: We just grab the most recent created userID from a table we have access to?
  // Or we just insert for a specific known UUID if you have it. 
  // Let's try to list users via auth admin API if key is service role.
  
  const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
  
  if (userError || !users || users.length === 0) {
     console.error('Could not find users to assign cards to. Make sure SUPABASE_SERVICE_ROLE_KEY is in .env');
     return;
  }

  const targetUser = users[0]; // Target the first user found
  console.log(`Assigning cards to user ${targetUser.email} (${targetUser.id})...`);

  // 3. Check existing user cards to avoid duplicates manually
  const { data: existingCards } = await supabase
    .from('user_flashcards')
    .select('template_id')
    .eq('user_id', targetUser.id);
    
  const existingIds = new Set(existingCards?.map(c => c.template_id));
  
  const templatesToInsert = templates.filter(t => !existingIds.has(t.id));

  if (templatesToInsert.length === 0) {
      console.log('User already has all flashcards assigned.');
      return;
  }
  
  console.log(`Found ${templatesToInsert.length} new cards to assign.`);

  const cardsToInsert = templatesToInsert.map(t => ({
      user_id: targetUser.id,
      template_id: t.id,
      due: new Date().toISOString(),
      lapses: 0,
      reps: 0,
      stability: 0,
      difficulty: 0,
      elapsed_days: 0,
      scheduled_days: 0,
      learning_steps: 0,
      state: 0,
      last_review: null
  }));

  // 4. Batch insert (standard insert)
  const { error: insertError } = await supabase
    .from('user_flashcards')
    .insert(cardsToInsert);

  if (insertError) {
    console.error('Error assigning cards:', insertError);
  } else {
    console.log('Success! All cards have been assigned.');
  }
}

assignAllCards();
