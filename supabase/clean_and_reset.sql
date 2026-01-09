-- MASTER CLEANUP SCRIPT
-- USE THIS TO FIX "DUPLICATE KEY" ERRORS
-- This script force-deletes ALL data from the content tables to allow a clean migration.

-- 1. Truncate all tables (Cascade ensures child tables like articles are also cleared)
TRUNCATE TABLE 
    saved_articles,
    user_activity_log,
    daily_news_videos,
    articles,
    app_messages,
    tutorials,
    sources,
    categories,
    article_scores,
    newsletters,
    daily_messages,
    jt_backgrounds,
    photo_avatar_personnalite,
    planning_cours
CASCADE; -- 'CASCADE' automatically cleans dependent tables

-- 2. Drop Unique Constraint on sources(name) 
-- (Source DB has duplicates like "ActuIA", so we must allow them here too)
ALTER TABLE sources DROP CONSTRAINT IF EXISTS sources_name_key;

-- 3. Verify RLS is disabled (just to be safe for the migration tool)
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE sources DISABLE ROW LEVEL SECURITY;
ALTER TABLE articles DISABLE ROW LEVEL SECURITY;
ALTER TABLE daily_news_videos DISABLE ROW LEVEL SECURITY;
ALTER TABLE tutorials DISABLE ROW LEVEL SECURITY;
ALTER TABLE app_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- 3. (Optional) Re-apply column fixes just in case they were missed
-- Adding these IF NOT EXISTS safeguards ensures we are 100% ready
ALTER TABLE sources ADD COLUMN IF NOT EXISTS fetch_error_count INTEGER DEFAULT 0;
ALTER TABLE sources ADD COLUMN IF NOT EXISTS last_fetch_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE sources ADD COLUMN IF NOT EXISTS fetch_status VARCHAR(20) DEFAULT 'active';
ALTER TABLE sources ADD COLUMN IF NOT EXISTS last_error_message TEXT;

-- 4. Result check
-- After running this, the migration tool will find 0 entries and can insert cleanly.
