-- Migration: Insert sample RSS sources for AI news
-- These are popular AI/ML news sources with RSS feeds

INSERT INTO sources (name, url, rss_url, type, is_active, logo_url) VALUES
  -- AI News Sites
  ('MIT Technology Review - AI', 'https://www.technologyreview.com', 'https://www.technologyreview.com/feed/', 'rss', true, 'https://www.technologyreview.com/favicon.ico'),
  ('VentureBeat AI', 'https://venturebeat.com', 'https://venturebeat.com/category/ai/feed/', 'rss', true, 'https://venturebeat.com/favicon.ico'),
  ('The Verge AI', 'https://www.theverge.com', 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml', 'rss', true, 'https://www.theverge.com/favicon.ico'),
  ('TechCrunch AI', 'https://techcrunch.com', 'https://techcrunch.com/category/artificial-intelligence/feed/', 'rss', true, 'https://techcrunch.com/favicon.ico'),
  
  -- Research & Academic
  ('arXiv AI', 'https://arxiv.org', 'https://rss.arxiv.org/rss/cs.AI', 'rss', true, 'https://arxiv.org/favicon.ico'),
  ('Google AI Blog', 'https://ai.googleblog.com', 'https://ai.googleblog.com/feeds/posts/default', 'rss', true, 'https://www.google.com/favicon.ico'),
  ('OpenAI Blog', 'https://openai.com/blog', 'https://openai.com/blog/rss.xml', 'rss', true, 'https://openai.com/favicon.ico'),
  ('DeepMind Blog', 'https://deepmind.google', 'https://deepmind.google/blog/rss.xml', 'rss', true, 'https://deepmind.google/favicon.ico'),
  
  -- French AI News
  ('Actualité IA', 'https://www.actuia.com', 'https://www.actuia.com/feed/', 'rss', true, 'https://www.actuia.com/favicon.ico'),
  ('Le Big Data', 'https://www.lebigdata.fr', 'https://www.lebigdata.fr/feed', 'rss', true, 'https://www.lebigdata.fr/favicon.ico'),
  
  -- Specialized
  ('Towards Data Science', 'https://towardsdatascience.com', 'https://towardsdatascience.com/feed', 'rss', true, 'https://towardsdatascience.com/favicon.ico'),
  ('Machine Learning Mastery', 'https://machinelearningmastery.com', 'https://machinelearningmastery.com/feed/', 'rss', true, 'https://machinelearningmastery.com/favicon.ico'),
  ('Papers With Code', 'https://paperswithcode.com', 'https://paperswithcode.com/feeds/latest/', 'rss', true, 'https://paperswithcode.com/favicon.ico')
ON CONFLICT (name) DO UPDATE SET
  rss_url = EXCLUDED.rss_url,
  is_active = EXCLUDED.is_active;

-- Add comment
COMMENT ON TABLE sources IS 'RSS feed sources for AI news aggregation';
