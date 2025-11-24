-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For full-text search

-- Categories table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  color VARCHAR(7),
  icon VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sources table
CREATE TABLE sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  url TEXT NOT NULL,
  rss_url TEXT,
  type VARCHAR(20) NOT NULL CHECK (type IN ('rss', 'api', 'scraping', 'twitter')),
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Articles table
CREATE TABLE articles (
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
  view_count INTEGER DEFAULT 0,
  is_daily_news BOOLEAN DEFAULT false,
  daily_news_date DATE,
  relevance_score DECIMAL(5,2)
);

-- Create index for full-text search
CREATE INDEX articles_title_idx ON articles USING gin(to_tsvector('french', title));
CREATE INDEX articles_content_idx ON articles USING gin(to_tsvector('french', content));
CREATE INDEX articles_tags_idx ON articles USING gin(tags);
CREATE INDEX articles_published_at_idx ON articles(published_at DESC);

-- User profiles table (extends Supabase auth.users)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(200),
  avatar_url TEXT,
  preferences JSONB DEFAULT '{"keywords": [], "categories": [], "sources": [], "excluded_keywords": []}',
  newsletter_frequency VARCHAR(20) DEFAULT 'weekly' CHECK (newsletter_frequency IN ('daily', 'weekly', 'monthly')),
  send_day INTEGER CHECK (send_day BETWEEN 0 AND 6),
  timezone VARCHAR(50) DEFAULT 'Europe/Paris',
  -- Onboarding fields
  onboarding_completed BOOLEAN DEFAULT false,
  user_type VARCHAR(20) CHECK (user_type IN ('professionnel', 'particulier')),
  experience_level VARCHAR(20) CHECK (experience_level IN ('debutant', 'intermediaire', 'pro')),
  interests TEXT[] DEFAULT '{}',
  tools_used TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User activity log
CREATE TABLE user_activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  action VARCHAR(20) NOT NULL CHECK (action IN ('view', 'click', 'save', 'like', 'dislike', 'share')),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX user_activity_user_idx ON user_activity_log(user_id, timestamp DESC);
CREATE INDEX user_activity_article_idx ON user_activity_log(article_id);

-- Saved articles
CREATE TABLE saved_articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  UNIQUE(user_id, article_id)
);

CREATE INDEX saved_articles_user_idx ON saved_articles(user_id, saved_at DESC);

-- Article scores (for recommendation engine)
CREATE TABLE article_scores (
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  score DECIMAL(5,2) NOT NULL,
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (article_id, user_id)
);

-- Newsletters
CREATE TABLE newsletters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  sent_at TIMESTAMP WITH TIME ZONE,
  articles UUID[] DEFAULT '{}',
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX newsletters_user_idx ON newsletters(user_id, sent_at DESC);

-- Daily News Videos (JT quotidien)
CREATE TABLE daily_news_videos (
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

CREATE INDEX daily_news_videos_date_idx ON daily_news_videos(date DESC);
CREATE INDEX daily_news_videos_status_idx ON daily_news_videos(status);


-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletters ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_news_videos ENABLE ROW LEVEL SECURITY;


-- Articles: Public read, admin write
CREATE POLICY "Articles are viewable by everyone" ON articles
  FOR SELECT USING (true);

CREATE POLICY "Only admins can insert articles" ON articles
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Only admins can update articles" ON articles
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

-- User profiles: Users can read/update their own profile
CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- User activity log: Users can insert and read their own logs
CREATE POLICY "Users can insert their own activity" ON user_activity_log
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own activity" ON user_activity_log
  FOR SELECT USING (auth.uid() = user_id);

-- Saved articles: Users can manage their own saved articles
CREATE POLICY "Users can manage their saved articles" ON saved_articles
  FOR ALL USING (auth.uid() = user_id);

-- Article scores: Users can view their own scores
CREATE POLICY "Users can view their own scores" ON article_scores
  FOR SELECT USING (auth.uid() = user_id);

-- Newsletters: Users can view their own newsletters
CREATE POLICY "Users can view their own newsletters" ON newsletters
  FOR SELECT USING (auth.uid() = user_id);

-- Daily News Videos: Public read
CREATE POLICY "Daily news videos are viewable by everyone" ON daily_news_videos
  FOR SELECT USING (true);


-- Functions

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for articles
CREATE TRIGGER update_articles_updated_at
  BEFORE UPDATE ON articles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for user_profiles
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Insert default categories
INSERT INTO categories (name, slug, description, color) VALUES
  ('Machine Learning', 'machine-learning', 'Apprentissage automatique et modèles prédictifs', '#3B82F6'),
  ('LLM', 'llm', 'Modèles de langage de grande taille', '#8B5CF6'),
  ('Computer Vision', 'computer-vision', 'Vision par ordinateur et traitement d''images', '#10B981'),
  ('Éthique IA', 'ethique-ia', 'Enjeux éthiques et sociétaux de l''IA', '#F59E0B'),
  ('Recherche', 'recherche', 'Publications académiques et recherche fondamentale', '#EF4444'),
  ('Applications', 'applications', 'Applications pratiques de l''IA', '#06B6D4'),
  ('Réglementation', 'reglementation', 'Cadre juridique et réglementaire', '#EC4899')
ON CONFLICT (slug) DO NOTHING;
