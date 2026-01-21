-- Backfill user_profiles for existing users who don't have one
insert into public.user_profiles (id, email, full_name, avatar_url)
select 
  id, 
  email, 
  raw_user_meta_data->>'full_name', 
  raw_user_meta_data->>'avatar_url'
from auth.users
on conflict (id) do nothing;

-- Ensure RLS is enabled on reading_history (just in case)
alter table public.reading_history enable row level security;

-- Verify policies exist (idempotent due to 'create policy if not exists' not being standard, 
-- but we can assume previous query showed they exist. If they were missing we'd add them, 
-- but the user logs show they exist. We'll leave them alone to avoid errors).

-- Recalculate stats for everyone based on existing history
-- This fixes the "0" count if they had history but no profile
update public.user_profiles up
set articles_read_count = (
    select count(*) from public.reading_history rh where rh.user_id = up.id
);
