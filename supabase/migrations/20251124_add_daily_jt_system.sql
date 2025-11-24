-- Migration: Add Daily News JT System
-- Date: 2025-11-24
-- Description: Ajoute les tables et champs nécessaires pour le système de JT vidéo quotidien

-- Ajouter les champs pour marquer les articles "news du jour"
ALTER TABLE articles 
ADD COLUMN IF NOT EXISTS is_daily_news BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS daily_news_date DATE,
ADD COLUMN IF NOT EXISTS relevance_score DECIMAL(5,2);

-- Créer la table pour les JT vidéos quotidiens
CREATE TABLE IF NOT EXISTS daily_news_videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL UNIQUE,
  title VARCHAR(500) NOT NULL,
  script TEXT NOT NULL,
  article_ids UUID[] DEFAULT '{}',
  video_url TEXT,
  thumbnail_url TEXT,
  duration INTEGER, -- en secondes
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  d_id_talk_id VARCHAR(100),
  d_id_result JSONB,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  view_count INTEGER DEFAULT 0
);

-- Créer les index pour les performances
CREATE INDEX IF NOT EXISTS daily_news_videos_date_idx ON daily_news_videos(date DESC);
CREATE INDEX IF NOT EXISTS daily_news_videos_status_idx ON daily_news_videos(status);
CREATE INDEX IF NOT EXISTS articles_daily_news_idx ON articles(is_daily_news, daily_news_date DESC) WHERE is_daily_news = true;

-- Activer RLS sur la nouvelle table
ALTER TABLE daily_news_videos ENABLE ROW LEVEL SECURITY;

-- Politique de lecture publique pour les JT
CREATE POLICY IF NOT EXISTS "Daily news videos are viewable by everyone" 
ON daily_news_videos
FOR SELECT 
USING (true);

-- Politique d'insertion pour les admins/service role uniquement
CREATE POLICY IF NOT EXISTS "Only service role can manage daily news videos" 
ON daily_news_videos
FOR ALL 
USING (auth.jwt() ->> 'role' = 'service_role');
