-- Script pour activer le suivi de lecture dans Supabase
-- A exécuter dans le SQL Editor de Supabase

-- 1. Création de la table d'historique de lecture (log complet)
create table if not exists public.reading_history (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  article_id text, -- On utilise text pour supporter les IDs divers (legacy/uuid)
  article_title text,
  article_category text,
  article_tags text[],
  reading_duration int,
  read_at timestamp with time zone default now()
);

-- Sécurité (RLS) pour l'historique
alter table public.reading_history enable row level security;

create policy "Users can insert their own history" 
on public.reading_history for insert 
with check (auth.uid() = user_id);

create policy "Users can view their own history" 
on public.reading_history for select 
using (auth.uid() = user_id);

-- 2. Création de la table des interactions uniques (statut vu, liké, bookmarké)
-- Note : Cette table nécessite que la table 'articles' existe avec des UUIDs.
create table if not exists public.article_interactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  article_id uuid references public.articles(id) on delete cascade, 
  is_read boolean default false,
  is_liked boolean default false,
  is_bookmarked boolean default false,
  last_interacted_at timestamp with time zone default now(),
  unique(user_id, article_id)
);

-- Sécurité (RLS) pour les interactions
alter table public.article_interactions enable row level security;

create policy "Users can manage interactions" 
on public.article_interactions for all 
using (auth.uid() = user_id);

-- 3. Fonction Trigger pour synchroniser l'historique vers les interactions
-- Cette fonction met à jour article_interactions quand une ligne est ajoutée dans reading_history
create or replace function public.on_reading_history_insert()
returns trigger
language plpgsql
security definer
as $$
begin
  -- Tentative de mise à jour si l'article_id est un UUID valide
  -- (Si c'est un ID text/numérique legacy, ça sera ignoré pour article_interactions qui demande un UUID)
  begin
      if new.article_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
          insert into public.article_interactions (user_id, article_id, is_read, last_interacted_at)
          values (new.user_id, new.article_id::uuid, true, now())
          on conflict (user_id, article_id) do update
          set 
              is_read = true,
              last_interacted_at = now();
      end if;
  exception when others then
      -- Ignorer les erreurs de conversion ou autre
  end;

  return new;
end;
$$;

-- Création du trigger
drop trigger if exists trigger_on_reading_history_insert on public.reading_history;
create trigger trigger_on_reading_history_insert
  after insert on public.reading_history
  for each row execute procedure public.on_reading_history_insert();
