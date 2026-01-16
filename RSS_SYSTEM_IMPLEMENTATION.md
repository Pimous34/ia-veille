# ✅ Système d'Agrégation RSS Automatique - Implémentation Complète

## 🎯 Résumé

Un système complet de collecte automatique d'articles depuis des flux RSS a été créé avec :
- **Collecte automatique toutes les 8 heures** via Supabase Cron
- **Edge Function Deno** pour le parsing et le stockage
- **Déduplication automatique** par URL et GUID
- **13 sources RSS pré-configurées** (MIT Tech Review, VentureBeat, arXiv, etc.)
- **Monitoring et logs** intégrés

## 📁 Fichiers Créés

### Migrations SQL

1. **`supabase/migrations/add_rss_fields.sql`**
   - Ajoute les champs RSS aux tables `sources` et `articles`
   - Crée les index pour la déduplication
   - Ajoute les champs de tracking (last_fetch_date, fetch_status, etc.)

2. **`supabase/migrations/insert_rss_sources.sql`**
   - Insère 13 sources RSS d'actualités IA
   - Sources en anglais et français
   - Couvre : actualités, recherche, blogs techniques

3. **`supabase/migrations/setup_rss_cron.sql`**
   - Configure le Cron Job (toutes les 8h)
   - Crée la table `app_settings` pour la configuration
   - Crée la table `rss_fetch_logs` pour le monitoring
   - Configure les permissions pg_cron

### Edge Function

4. **`supabase/functions/fetch-rss/index.ts`**
   - Fonction Deno pour la collecte RSS
   - Parse les flux XML avec rss-parser
   - Déduplication par canonical_url et rss_guid
   - Batch upsert pour l'efficacité
   - Gestion d'erreurs robuste
   - Logging détaillé

### Scripts & Documentation

5. **`scripts/test-rss-fetch.ts`**
   - Script de test pour l'Edge Function
   - Vérifie les sources actives
   - Appelle la fonction et affiche les résultats

6. **`docs/RSS_AGGREGATION_SETUP.md`**
   - Guide complet de déploiement
   - Instructions pas à pas
   - Commandes SQL pour le monitoring
   - Dépannage

## 🚀 Déploiement Rapide

### Étape 1 : Appliquer les Migrations

Dans le **SQL Editor** de Supabase, exécutez dans l'ordre :

```sql
-- 1. Ajouter les champs RSS
-- Copiez le contenu de: supabase/migrations/add_rss_fields.sql

-- 2. Insérer les sources
-- Copiez le contenu de: supabase/migrations/insert_rss_sources.sql

-- 3. Configurer le Cron
-- Copiez le contenu de: supabase/migrations/setup_rss_cron.sql
```

### Étape 2 : Configurer les Paramètres

```sql
-- Mettez à jour avec vos vraies valeurs
UPDATE app_settings 
SET value = 'https://jrlecaepyoivtplpvwoe.supabase.co/functions/v1'
WHERE key = 'edge_function_url';

UPDATE app_settings 
SET value = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpybGVjYWVweW9pdnRwbHB2d29lIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTU3NDI4NiwiZXhwIjoyMDc3MTUwMjg2fQ.rzzfmguz5maKd2Jd9RknA9cYcbvw3MDa8Mzos-RXGvE'
WHERE key = 'service_role_key';
```

### Étape 3 : Déployer l'Edge Function

```bash
# Installer Supabase CLI (si nécessaire)
npm install -g supabase

# Se connecter
supabase login

# Lier le projet
supabase link --project-ref jrlecaepyoivtplpvwoe

# Déployer la fonction
cd "d:\Ai Quick Feed\CascadeProjects\windsurf-project\ia-veille"
supabase functions deploy fetch-rss
```

### Étape 4 : Tester

```bash
# Via cURL
curl -X POST \
  'https://jrlecaepyoivtplpvwoe.supabase.co/functions/v1/fetch-rss' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpybGVjYWVweW9pdnRwbHB2d29lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1NzQyODYsImV4cCI6MjA3NzE1MDI4Nn0.wI14KgoWWH5haTURjgsxVZNaY7OWHIx20PmTUGTF1Jo' \
  -H 'Content-Type: application/json' \
  -d '{"action": "fetch_rss"}'
```

## 📊 Monitoring

### Vérifier le Cron Job

```sql
-- Statut du job
SELECT * FROM cron_job_status;

-- Historique des exécutions
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'fetch-rss-feeds')
ORDER BY start_time DESC
LIMIT 10;
```

### Voir les Articles Collectés

```sql
SELECT 
  a.title,
  s.name as source,
  a.published_at,
  a.created_at
FROM articles a
JOIN sources s ON a.source_id = s.id
ORDER BY a.created_at DESC
LIMIT 20;
```

### Statistiques par Source

```sql
SELECT 
  s.name,
  s.last_fetch_date,
  COUNT(a.id) as article_count
FROM sources s
LEFT JOIN articles a ON s.id = a.source_id
WHERE s.type = 'rss'
GROUP BY s.id, s.name, s.last_fetch_date
ORDER BY article_count DESC;
```

## 🔧 Configuration

### Sources RSS Incluses

**Actualités IA (Anglais)**
- MIT Technology Review - AI
- VentureBeat AI
- The Verge AI
- TechCrunch AI

**Recherche & Académique**
- arXiv AI
- Google AI Blog
- OpenAI Blog
- DeepMind Blog

**Actualités IA (Français)**
- Actualité IA
- Le Big Data

**Spécialisés**
- Towards Data Science
- Machine Learning Mastery
- Papers With Code

### Modifier la Fréquence

```sql
-- Toutes les 4 heures
SELECT cron.alter_job(
  job_id := (SELECT jobid FROM cron.job WHERE jobname = 'fetch-rss-feeds'),
  schedule := '0 */4 * * *'
);

-- Tous les jours à 6h
SELECT cron.alter_job(
  job_id := (SELECT jobid FROM cron.job WHERE jobname = 'fetch-rss-feeds'),
  schedule := '0 6 * * *'
);
```

### Ajouter une Source

```sql
INSERT INTO sources (name, url, rss_url, type, is_active) VALUES
  ('Nouvelle Source', 'https://example.com', 'https://example.com/feed.xml', 'rss', true);
```

## 🎯 Fonctionnalités Clés

### ✅ Déduplication Intelligente
- Par `canonical_url` (URL de l'article)
- Par `rss_guid` (identifiant RSS)
- Index uniques pour éviter les doublons

### ✅ Gestion d'Erreurs
- Compteur d'erreurs par source
- Stockage du dernier message d'erreur
- Désactivation automatique possible

### ✅ Performance
- Batch upsert (insertion groupée)
- Index optimisés
- Timeout de 10s par flux

### ✅ Monitoring
- Logs détaillés dans la console
- Table `rss_fetch_logs` pour l'historique
- Statistiques par source

## 🐛 Dépannage

### Erreur "pg_cron extension not found"

```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
```

### Erreur "permission denied for schema cron"

```sql
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;
```

### Aucun article collecté

1. Vérifiez que les sources sont actives :
```sql
SELECT name, is_active FROM sources WHERE type = 'rss';
```

2. Testez manuellement un flux :
```bash
curl 'https://www.technologyreview.com/feed/'
```

3. Consultez les logs de l'Edge Function dans le Dashboard Supabase

## 📈 Prochaines Étapes

1. **Catégorisation Automatique**
   - Utiliser l'IA pour classifier les articles
   - Assigner automatiquement aux catégories

2. **Extraction de Mots-Clés**
   - NLP pour extraire les concepts clés
   - Améliorer la recherche

3. **Scoring de Pertinence**
   - Calculer un score pour chaque article
   - Personnaliser par utilisateur

4. **Notifications**
   - Alertes pour les articles importants
   - Webhooks pour intégrations

## 📚 Documentation Complète

Consultez `docs/RSS_AGGREGATION_SETUP.md` pour :
- Guide détaillé de déploiement
- Toutes les commandes SQL
- Exemples de monitoring
- Troubleshooting avancé

## ✅ Statut

- [x] Migrations SQL créées
- [x] Edge Function développée
- [x] Cron Job configuré
- [x] Sources RSS ajoutées
- [x] Script de test créé
- [x] Documentation complète
- [ ] Edge Function déployée (à faire)
- [ ] Cron Job activé (à faire)
- [ ] Premier test de collecte (à faire)
