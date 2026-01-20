-- Create a table for public user profiles/stats
create table if not exists public.user_profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  full_name text,
  avatar_url text,
  
  -- Gamification & Stats
  articles_read_count integer default 0,
  articles_liked_count integer default 0,
  flashcards_mastered_count integer default 0,
  xp_points integer default 0,
  current_streak integer default 0,
  last_active_at timestamp with time zone default now(),
  
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.user_profiles enable row level security;

-- Policies
drop policy if exists "Public profiles are viewable by everyone" on public.user_profiles;
create policy "Public profiles are viewable by everyone"
  on public.user_profiles for select
  using ( true );

drop policy if exists "Users can update their own profile" on public.user_profiles;
create policy "Users can update their own profile"
  on public.user_profiles for update
  using ( auth.uid() = id );

-- Create a table for article interactions (likes, bookmarks, read history)
create table if not exists public.article_interactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.user_profiles(id) on delete cascade not null,
  article_id uuid references public.articles(id) on delete cascade not null,
  
  is_read boolean default false,
  is_liked boolean default false,
  is_bookmarked boolean default false, -- "À regarder plus tard"
  
  last_interacted_at timestamp with time zone default now(),
  
  unique(user_id, article_id)
);

-- Enable RLS for interactions
alter table public.article_interactions enable row level security;

drop policy if exists "Users can view and edit their own interactions" on public.article_interactions;
create policy "Users can view and edit their own interactions"
  on public.article_interactions
  for all
  using ( auth.uid() = user_id );

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.user_profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

-- Trigger to call the function on signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
