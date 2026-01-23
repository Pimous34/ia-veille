-- Backfill missing flashcards for existing users
INSERT INTO public.user_flashcards (user_id, template_id, due, stability, difficulty, elapsed_days, scheduled_days, reps, state, lapses, learning_steps)
SELECT 
  p.id as user_id,
  t.id as template_id,
  now() as due,
  0 as stability,
  0 as difficulty,
  0 as elapsed_days,
  0 as scheduled_days,
  0 as reps,
  0 as state,
  0 as lapses,
  0 as learning_steps
FROM public.user_profiles p
CROSS JOIN public.flashcard_templates t
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_flashcards uf 
  WHERE uf.user_id = p.id AND uf.template_id = t.id
);

-- Update handle_new_user to automatically assign flashcards on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
begin
  -- Use ON CONFLICT to just update timestamp if user already exists
  insert into public.user_profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = excluded.full_name,
    avatar_url = excluded.avatar_url,
    updated_at = now();
  
  -- Initialize flashcards for the new user
  insert into public.user_flashcards (user_id, template_id, due, stability, difficulty, elapsed_days, scheduled_days, reps, state, lapses, learning_steps)
  select 
    new.id,
    id,
    now(),
    0, 0, 0, 0, 0, 0, 0, 0
  from public.flashcard_templates;

  return new;
end;
$function$;
