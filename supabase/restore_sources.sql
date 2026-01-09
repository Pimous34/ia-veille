-- Restore 48 Sources from backup
-- Updated to fix "no unique constraint" error

-- 1. Ensure the unique constraint exists on 'name'
-- This is required for the ON CONFLICT clause to work
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'sources_name_key'
    ) THEN
        ALTER TABLE sources ADD CONSTRAINT sources_name_key UNIQUE (name);
    END IF;
END $$;

-- 2. Insert the data
INSERT INTO sources (name, url, rss_url, type, is_active, logo_url) VALUES
('Vision IA - Youtube', 'https://www.youtube.com/@VisionIA-FR', 'https://www.youtube.com/feeds/videos.xml?channel_id=UCyc03X3uRuxM9n7fyRH_gIw', 'rss', true, NULL),
('Google News - LLM', 'https://news.google.com', 'https://news.google.com/rss/search?q=LLM+language+model&hl=fr&gl=FR&ceid=FR:fr', 'rss', false, 'https://www.google.com/favicon.ico'),
('Google News - Machine Learning', 'https://news.google.com', 'https://news.google.com/rss/search?q=machine+learning&hl=fr&gl=FR&ceid=FR:fr', 'rss', false, 'https://www.google.com/favicon.ico'),
('Google News - Deep Learning', 'https://news.google.com', 'https://news.google.com/rss/search?q=deep+learning&hl=fr&gl=FR&ceid=FR:fr', 'rss', false, 'https://www.google.com/favicon.ico'),
('Google News - IA France', 'https://news.google.com', 'https://news.google.com/rss/search?q=IA+France&hl=fr&gl=FR&ceid=FR:fr', 'rss', false, 'https://www.google.com/favicon.ico'),
('Google News - OpenAI', 'https://news.google.com', 'https://news.google.com/rss/search?q=OpenAI&hl=fr&gl=FR&ceid=FR:fr', 'rss', false, 'https://www.google.com/favicon.ico'),
('Google News - IA Générative', 'https://news.google.com', 'https://news.google.com/rss/search?q=IA+générative&hl=fr&gl=FR&ceid=FR:fr', 'rss', false, 'https://www.google.com/favicon.ico'),
('Google News - ChatGPT', 'https://news.google.com', 'https://news.google.com/rss/search?q=ChatGPT&hl=fr&gl=FR&ceid=FR:fr', 'rss', false, 'https://www.google.com/favicon.ico'),
('TechCrunch AI', 'https://techcrunch.com', 'https://techcrunch.com/category/artificial-intelligence/feed/', 'rss', false, 'https://techcrunch.com/favicon.ico'),
('The Verge AI', 'https://www.theverge.com', 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml', 'rss', false, 'https://www.theverge.com/favicon.ico'),
('Frenchweb - IA', 'https://www.frenchweb.fr', 'https://www.frenchweb.fr/category/intelligence-artificielle/feed', 'rss', false, 'https://www.frenchweb.fr/favicon.ico'),
('Papers With Code', 'https://paperswithcode.com', 'https://paperswithcode.com/feeds/latest/', 'rss', false, 'https://paperswithcode.com/favicon.ico'),
('Ars Technica AI', 'https://arstechnica.com', 'https://arstechnica.com/tag/artificial-intelligence/feed/', 'rss', false, 'https://arstechnica.com/favicon.ico'),
('Microsoft Research AI', 'https://www.microsoft.com/en-us/research', 'https://www.microsoft.com/en-us/research/feed/', 'rss', false, 'https://www.microsoft.com/favicon.ico'),
('Anthropic News', 'https://www.anthropic.com/news', 'https://www.anthropic.com/news/rss.xml', 'rss', false, 'https://www.anthropic.com/favicon.ico'),
('Google AI Blog', 'https://ai.googleblog.com', 'https://ai.googleblog.com/feeds/posts/default', 'rss', false, 'https://www.google.com/favicon.ico'),
('arXiv Computer Vision', 'https://arxiv.org', 'https://arxiv.org/rss/cs.CV', 'rss', false, 'https://arxiv.org/favicon.ico'),
('AI News', 'https://artificialintelligence-news.com', 'https://artificialintelligence-news.com/feed/', 'rss', false, 'https://artificialintelligence-news.com/favicon.ico'),
('OpenAI Blog', 'https://openai.com/blog', 'https://openai.com/blog/rss.xml', 'rss', false, 'https://openai.com/favicon.ico'),
('VentureBeat AI', 'https://venturebeat.com', 'https://venturebeat.com/category/ai/feed/', 'rss', false, 'https://venturebeat.com/favicon.ico'),
('Google News - Computer Vision', 'https://news.google.com', 'https://news.google.com/rss/search?q=Computer+Vision+IA&hl=fr&gl=FR&ceid=FR:fr', 'rss', false, 'https://www.google.com/favicon.ico'),
('Google News - NLP', 'https://news.google.com', 'https://news.google.com/rss/search?q=NLP+traitement+langage+naturel&hl=fr&gl=FR&ceid=FR:fr', 'rss', false, 'https://www.google.com/favicon.ico'),
('ActuIA', 'https://www.actuia.com', 'https://www.actuia.com/feed/', 'rss', true, NULL),
('Siècle Digital (IA)', 'https://siecledigital.fr', 'https://siecledigital.fr/intelligence-artificielle/feed/', 'rss', true, NULL),
('Le Monde Informatique (Big Data/IA)', 'https://www.lemondeinformatique.fr', 'https://www.lemondeinformatique.fr/flux-rss/theme/big-data/rss.xml', 'rss', true, NULL),
('Blog du Modérateur (IA)', 'https://www.blogdumoderateur.com', 'https://www.blogdumoderateur.com/dossier/intelligence-artificielle/feed/', 'rss', true, NULL),
('arXiv Machine Learning', 'https://arxiv.org', 'https://rss.arxiv.org/rss/cs.LG', 'rss', false, 'https://arxiv.org/favicon.ico'),
('Siècle Digital - IA', 'https://siecledigital.fr', 'https://siecledigital.fr/category/intelligence-artificielle/feed/', 'rss', false, 'https://siecledigital.fr/favicon.ico'),
('Google News - Llama', 'https://news.google.com', 'https://news.google.com/rss/search?q=Llama+Meta+AI&hl=fr&gl=FR&ceid=FR:fr', 'rss', false, 'https://www.google.com/favicon.ico'),
('Google News - GitHub Copilot', 'https://news.google.com', 'https://news.google.com/rss/search?q=GitHub+Copilot&hl=fr&gl=FR&ceid=FR:fr', 'rss', false, 'https://www.google.com/favicon.ico'),
('Google News - IA Éthique', 'https://news.google.com', 'https://news.google.com/rss/search?q=éthique+intelligence+artificielle&hl=fr&gl=FR&ceid=FR:fr', 'rss', false, 'https://www.google.com/favicon.ico'),
('DeepMind Blog', 'https://deepmind.google', 'https://deepmind.google/blog/rss.xml', 'rss', false, 'https://deepmind.google/favicon.ico'),
('Meta AI Blog', 'https://ai.meta.com', 'https://ai.meta.com/blog/rss/', 'rss', false, 'https://ai.meta.com/favicon.ico'),
('arXiv AI', 'https://arxiv.org', 'https://rss.arxiv.org/rss/cs.AI', 'rss', false, 'https://arxiv.org/favicon.ico'),
('Hugging Face Blog', 'https://huggingface.co', 'https://huggingface.co/blog/feed.xml', 'rss', false, 'https://huggingface.co/favicon.ico'),
('Google News - Anthropic', 'https://news.google.com', 'https://news.google.com/rss/search?q=Anthropic+Claude&hl=fr&gl=FR&ceid=FR:fr', 'rss', false, 'https://www.google.com/favicon.ico'),
('Google News - Midjourney', 'https://news.google.com', 'https://news.google.com/rss/search?q=Midjourney&hl=fr&gl=FR&ceid=FR:fr', 'rss', false, 'https://www.google.com/favicon.ico'),
('USbek & Rica - IA', 'https://usbeketrica.com', 'https://usbeketrica.com/fr/rss/tags/intelligence-artificielle', 'rss', false, 'https://usbeketrica.com/favicon.ico'),
('Google News - Mistral AI', 'https://news.google.com', 'https://news.google.com/rss/search?q=Mistral+AI&hl=fr&gl=FR&ceid=FR:fr', 'rss', false, 'https://www.google.com/favicon.ico'),
('Google News - Gemini', 'https://news.google.com', 'https://news.google.com/rss/search?q=Google+Gemini+AI&hl=fr&gl=FR&ceid=FR:fr', 'rss', false, 'https://www.google.com/favicon.ico'),
('MIT Technology Review - AI', 'https://www.technologyreview.com', 'https://www.technologyreview.com/feed/', 'rss', false, 'https://www.technologyreview.com/favicon.ico'),
('Towards Data Science', 'https://towardsdatascience.com', 'https://towardsdatascience.com/feed', 'rss', false, 'https://towardsdatascience.com/favicon.ico'),
('Le Big Data', 'https://www.lebigdata.fr', 'https://www.lebigdata.fr/feed', 'rss', false, 'https://www.lebigdata.fr/favicon.ico'),
('Blog du Modérateur', 'https://www.blogdumoderateur.com/tag/intelligence-artificielle/feed/', 'https://www.blogdumoderateur.com/tag/intelligence-artificielle/feed/', 'rss', true, NULL),
('Le journal du Net', 'https://www.journaldunet.com/solutions/intelligence-artificielle/rss/', 'https://www.journaldunet.com/solutions/intelligence-artificielle/rss/', 'rss', true, NULL),
('Actu IA', 'https://www.actuia.com/feed/', 'https://www.actuia.com/feed/', 'rss', true, NULL),
('Machine Learning Mastery', 'https://machinelearningmastery.com', 'https://machinelearningmastery.com/feed/', 'rss', false, 'https://machinelearningmastery.com/favicon.ico'),
('Wired AI', 'https://www.wired.com', 'https://www.wired.com/feed/tag/ai/latest/rss', 'rss', false, 'https://www.wired.com/favicon.ico')
ON CONFLICT (name) DO NOTHING;
