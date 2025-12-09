-- Sources RSS recommandées pour l'actualité IA
-- À insérer dans la table 'sources' de votre base de données

-- Sites d'actualité IA francophones
INSERT INTO sources (name, url, rss_url, type, is_active) VALUES
  ('ActuIA', 'https://www.actuia.com', 'https://www.actuia.com/feed/', 'rss', true),
  ('L''Usine Digitale - IA', 'https://www.usine-digitale.fr', 'https://www.usine-digitale.fr/intelligence-artificielle/rss', 'rss', true),
  ('Le Big Data', 'https://www.lebigdata.fr', 'https://www.lebigdata.fr/feed', 'rss', true);

-- Sites d'actualité IA anglophones (majeurs)
INSERT INTO sources (name, url, rss_url, type, is_active) VALUES
  ('MIT Technology Review - AI', 'https://www.technologyreview.com', 'https://www.technologyreview.com/topic/artificial-intelligence/feed', 'rss', true),
  ('VentureBeat AI', 'https://venturebeat.com', 'https://venturebeat.com/category/ai/feed/', 'rss', true),
  ('The Verge AI', 'https://www.theverge.com', 'https://www.theverge.com/ai-artificial-intelligence/rss/index.xml', 'rss', true),
  ('TechCrunch AI', 'https://techcrunch.com', 'https://techcrunch.com/category/artificial-intelligence/feed/', 'rss', true),
  ('AI News', 'https://artificialintelligence-news.com', 'https://artificialintelligence-news.com/feed/', 'rss', true);

-- Blogs de recherche et entreprises
INSERT INTO sources (name, url, rss_url, type, is_active) VALUES
  ('OpenAI Blog', 'https://openai.com/blog', 'https://openai.com/blog/rss.xml', 'rss', true),
  ('Google AI Blog', 'https://ai.googleblog.com', 'https://ai.googleblog.com/feeds/posts/default', 'rss', true),
  ('DeepMind Blog', 'https://deepmind.google/blog', 'https://deepmind.google/blog/rss.xml', 'rss', true),
  ('Meta AI Blog', 'https://ai.meta.com/blog', 'https://ai.meta.com/blog/rss/', 'rss', true),
  ('Microsoft Research AI', 'https://www.microsoft.com/en-us/research', 'https://www.microsoft.com/en-us/research/feed/', 'rss', true),
  ('Anthropic News', 'https://www.anthropic.com/news', 'https://www.anthropic.com/news/rss.xml', 'rss', true);

-- Publications académiques et recherche
INSERT INTO sources (name, url, rss_url, type, is_active) VALUES
  ('arXiv AI', 'https://arxiv.org', 'https://arxiv.org/rss/cs.AI', 'rss', true),
  ('arXiv Machine Learning', 'https://arxiv.org', 'https://arxiv.org/rss/cs.LG', 'rss', true),
  ('arXiv Computer Vision', 'https://arxiv.org', 'https://arxiv.org/rss/cs.CV', 'rss', true);

-- Newsletters et agrégateurs
INSERT INTO sources (name, url, rss_url, type, is_active) VALUES
  ('Hugging Face Blog', 'https://huggingface.co/blog', 'https://huggingface.co/blog/feed.xml', 'rss', true),
  ('Papers with Code', 'https://paperswithcode.com', 'https://paperswithcode.com/latest/rss', 'rss', true);

-- Médias tech généralistes avec section IA
INSERT INTO sources (name, url, rss_url, type, is_active) VALUES
  ('Wired AI', 'https://www.wired.com', 'https://www.wired.com/feed/tag/ai/latest/rss', 'rss', true),
  ('Ars Technica AI', 'https://arstechnica.com', 'https://arstechnica.com/tag/artificial-intelligence/feed/', 'rss', true);

-- Sources françaises supplémentaires
INSERT INTO sources (name, url, rss_url, type, is_active) VALUES
  ('Siècle Digital - IA', 'https://siecledigital.fr', 'https://siecledigital.fr/category/intelligence-artificielle/feed/', 'rss', true),
  ('Frenchweb - IA', 'https://www.frenchweb.fr', 'https://www.frenchweb.fr/category/intelligence-artificielle/feed', 'rss', true);

-- Note: Certains flux RSS peuvent nécessiter une vérification
-- Testez chaque URL avant de les activer en production
-- Certains sites peuvent bloquer les requêtes automatisées

-- Pour vérifier qu'une source fonctionne:
-- SELECT * FROM sources WHERE is_active = true;

-- Pour désactiver une source qui ne fonctionne pas:
-- UPDATE sources SET is_active = false WHERE name = 'NOM_DE_LA_SOURCE';

-- Pour voir les statistiques d'agrégation:
-- SELECT 
--   s.name,
--   COUNT(a.id) as article_count,
--   MAX(a.published_at) as last_article
-- FROM sources s
-- LEFT JOIN articles a ON a.source_id = s.id
-- WHERE s.is_active = true
-- GROUP BY s.id, s.name
-- ORDER BY article_count DESC;
