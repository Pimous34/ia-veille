-- Add missing stats columns to user_profiles if they don't exist
alter table public.user_profiles 
  add column if not exists articles_read_count integer default 0,
  add column if not exists articles_liked_count integer default 0,
  add column if not exists flashcards_mastered_count integer default 0,
  add column if not exists xp_points integer default 0,
  add column if not exists current_streak integer default 0,
  add column if not exists last_active_at timestamp with time zone default now();

-- Ensure article_interactions exists (it might have been created by previous attempt)
create table if not exists public.article_interactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.user_profiles(id) on delete cascade not null,
  article_id uuid references public.articles(id) on delete cascade not null,
  
  is_read boolean default false,
  is_liked boolean default false,
  is_bookmarked boolean default false, 
  
  last_interacted_at timestamp with time zone default now(),
  
  unique(user_id, article_id)
);

-- RLS for interactions
alter table public.article_interactions enable row level security;

drop policy if exists "Users can view and edit their own interactions" on public.article_interactions;
create policy "Users can view and edit their own interactions"
  on public.article_interactions
  for all
  using ( auth.uid() = user_id );

-- Update the handle_new_user function to ensure it still works
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
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
  return new;
end;
$$;
