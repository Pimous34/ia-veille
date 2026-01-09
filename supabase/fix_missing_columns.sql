-- Fix Missing Columns in Schema
-- The initial restore script was simplified and missed some columns present in the production data.
-- This script adds them to ensure the migration tool can copy all data.

-- 1. SOURCES
ALTER TABLE sources ADD COLUMN IF NOT EXISTS last_fetch_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE sources ADD COLUMN IF NOT EXISTS fetch_status VARCHAR(20) DEFAULT 'active';
ALTER TABLE sources ADD COLUMN IF NOT EXISTS fetch_error_count INTEGER DEFAULT 0;
ALTER TABLE sources ADD COLUMN IF NOT EXISTS last_error_message TEXT;

-- 2. ARTICLES
ALTER TABLE articles ADD COLUMN IF NOT EXISTS rss_guid TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS canonical_url TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS source_url TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS is_daily_news BOOLEAN DEFAULT false;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS daily_news_date DATE;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS relevance_score NUMERIC(5,2);

-- Add unique constraint on canonical_url if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'articles_canonical_url_key') THEN
        ALTER TABLE articles ADD CONSTRAINT articles_canonical_url_key UNIQUE (canonical_url);
    END IF;
END $$;

-- 3. DAILY NEWS VIDEOS
ALTER TABLE daily_news_videos ADD COLUMN IF NOT EXISTS d_id_talk_id VARCHAR(100);
ALTER TABLE daily_news_videos ADD COLUMN IF NOT EXISTS d_id_result JSONB;
ALTER TABLE daily_news_videos ADD COLUMN IF NOT EXISTS error_message TEXT;
ALTER TABLE daily_news_videos ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;
-- view_count might already exist from full_restore, checks just in case
ALTER TABLE daily_news_videos ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;
ALTER TABLE daily_news_videos ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- 4. USER PROFILES
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS full_name VARCHAR(200);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS newsletter_frequency VARCHAR(20) DEFAULT 'weekly';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS send_day INTEGER;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'Europe/Paris';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS user_type TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS experience_level TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS ai_tools TEXT[];
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS interests TEXT[];
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS tools_used TEXT[];
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS wants_newsletter BOOLEAN DEFAULT false;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

-- Disable RLS on these modifications just in case
ALTER TABLE sources DISABLE ROW LEVEL SECURITY;
ALTER TABLE articles DISABLE ROW LEVEL SECURITY;
ALTER TABLE daily_news_videos DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
