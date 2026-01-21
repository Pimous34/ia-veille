-- Trigger function to update stats on new reading history
create or replace function public.on_reading_history_insert()
returns trigger
language plpgsql
security definer
as $$
begin
  -- 1. Increment read count in user_profiles
  update public.user_profiles
  set 
    articles_read_count = articles_read_count + 1,
    last_active_at = now()
  where id = new.user_id;

  -- 2. Upsert into article_interactions
  if new.article_id is not null then
    insert into public.article_interactions (user_id, article_id, is_read, last_interacted_at)
    values (new.user_id, new.article_id, true, now())
    on conflict (user_id, article_id) do update
    set 
        is_read = true,
        last_interacted_at = now();
  end if;

  return new;
end;
$$;

-- Create the trigger
drop trigger if exists trigger_on_reading_history_insert on public.reading_history;
create trigger trigger_on_reading_history_insert
  after insert on public.reading_history
  for each row execute procedure public.on_reading_history_insert();

-- Backfill helper: Update user_profiles counts from existing history if count is 0
-- (Only runs if count is 0 to avoid messing up manual edits, though manual edits shouldn't happen)
update public.user_profiles up
set articles_read_count = (
    select count(*) from public.reading_history rh where rh.user_id = up.id
)
where articles_read_count = 0;
