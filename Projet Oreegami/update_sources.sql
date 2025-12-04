
-- 1. Désactiver les anciennes sources (Google News)
UPDATE sources 
SET is_active = false 
WHERE type = 'rss';

-- 2. Insérer les nouvelles sources
INSERT INTO sources (name, url, rss_url, type, is_active)
VALUES 
    ('ActuIA', 'https://www.actuia.com', 'https://www.actuia.com/feed/', 'rss', true),
    ('Blog du Modérateur (IA)', 'https://www.blogdumoderateur.com', 'https://www.blogdumoderateur.com/tag/intelligence-artificielle/feed/', 'rss', true),
    ('Siècle Digital (IA)', 'https://siecledigital.fr', 'https://siecledigital.fr/intelligence-artificielle/feed/', 'rss', true),
    ('Le Monde Informatique (Big Data/IA)', 'https://www.lemondeinformatique.fr', 'https://www.lemondeinformatique.fr/flux-rss/theme/big-data/rss.xml', 'rss', true);

-- Note: L'URL pour Journal du Net fournie semble incorrecte (404). 
-- Vous pouvez essayer celle-ci si elle existe, ou la remplacer par une autre valide.
-- INSERT INTO sources (name, url, rss_url, type, is_active) VALUES ('Journal du Net (IA)', 'https://www.journaldunet.com', 'https://www.journaldunet.com/solutions/intelligence-artificielle/rss/', 'rss', true);
