-- Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 1. Categories
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  color VARCHAR(7),
  icon VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Sources
CREATE TABLE IF NOT EXISTS sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  url TEXT NOT NULL,
  rss_url TEXT,
  type VARCHAR(20) NOT NULL CHECK (type IN ('rss', 'api', 'scraping', 'twitter')),
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Articles
CREATE TABLE IF NOT EXISTS articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(500) NOT NULL,
  excerpt TEXT,
  content TEXT,
  url TEXT NOT NULL UNIQUE,
  image_url TEXT,
  source_id UUID REFERENCES sources(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  tags TEXT[] DEFAULT '{}',
  read_time INTEGER,
  author VARCHAR(200),
  view_count INTEGER DEFAULT 0
);

-- 4. Daily News Videos
CREATE TABLE IF NOT EXISTS daily_news_videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL UNIQUE,
  title VARCHAR(500) NOT NULL,
  script TEXT NOT NULL,
  article_ids UUID[] DEFAULT '{}',
  video_url TEXT,
  thumbnail_url TEXT,
  duration INTEGER,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. User Profiles (Simplified)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255),
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Functions & Triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_articles_updated_at ON articles;
CREATE TRIGGER update_articles_updated_at
  BEFORE UPDATE ON articles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert Default Categories
INSERT INTO categories (name, slug, description, color) VALUES
  ('Machine Learning', 'machine-learning', 'Apprentissage automatique', '#3B82F6'),
  ('LLM', 'llm', 'Grands modèles de langage', '#8B5CF6'),
  ('Computer Vision', 'computer-vision', 'Vision par ordinateur', '#10B981'),
  ('Éthique IA', 'ethique-ia', 'Éthique et société', '#F59E0B')
ON CONFLICT (slug) DO NOTHING;
