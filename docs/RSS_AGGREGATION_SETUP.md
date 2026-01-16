# 📡 Système d'Agrégation RSS Automatique

## Vue d'ensemble

Ce système collecte automatiquement des articles depuis des flux RSS toutes les 8 heures via :
- **Supabase Edge Functions** (Deno) pour le traitement
- **Supabase Cron** (pg_cron) pour la planification
- **Déduplication automatique** par URL et GUID

## 🏗️ Architecture

```
┌─────────────────┐
│  Supabase Cron  │  ← Toutes les 8h (0 */8 * * *)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Edge Function  │  ← Fetch & Parse RSS
│   (fetch-rss)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   PostgreSQL    │  ← Stockage articles
│   (articles)    │
└─────────────────┘
```

## 📋 Étapes de Déploiement

### 1. Appliquer les Migrations SQL

Exécutez ces migrations dans l'ordre dans le **SQL Editor** de Supabase :

#### a. Ajouter les champs RSS
```bash
supabase/migrations/add_rss_fields.sql
```

#### b. Insérer les sources RSS
```bash
supabase/migrations/insert_rss_sources.sql
```

#### c. Configurer le Cron Job
```bash
supabase/migrations/setup_rss_cron.sql
```

**Important** : Après avoir exécuté `setup_rss_cron.sql`, vous devez mettre à jour les valeurs dans la table `app_settings` :

```sql
-- Mettez à jour avec vos vraies valeurs
UPDATE app_settings 
SET value = 'https://jrlecaepyoivtplpvwoe.supabase.co/functions/v1'
WHERE key = 'edge_function_url';

UPDATE app_settings 
SET value = 'votre_service_role_key_ici'
WHERE key = 'service_role_key';
```

### 2. Déployer l'Edge Function

#### Installation de Supabase CLI (si pas déjà fait)

```bash
# Windows (PowerShell)
scoop install supabase

# macOS/Linux
brew install supabase/tap/supabase

# Ou via npm
npm install -g supabase
```

#### Connexion à votre projet

```bash
# Se connecter à Supabase
supabase login

# Lier votre projet
supabase link --project-ref jrlecaepyoivtplpvwoe
```

#### Déployer la fonction

```bash
# Depuis le dossier ia-veille
cd "d:\Ai Quick Feed\CascadeProjects\windsurf-project\ia-veille"

# Déployer la fonction fetch-rss
supabase functions deploy fetch-rss
```

### 3. Tester la Fonction Manuellement

#### Via cURL

```bash
curl -X POST \
  'https://jrlecaepyoivtplpvwoe.supabase.co/functions/v1/fetch-rss' \
  -H 'Authorization: Bearer VOTRE_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"action": "fetch_rss"}'
```

#### Via le Dashboard Supabase

1. Allez dans **Edge Functions** → **fetch-rss**
2. Cliquez sur **Invoke**
3. Envoyez `{"action": "fetch_rss"}`

### 4. Vérifier le Cron Job

```sql
-- Voir le statut du cron job
SELECT * FROM cron_job_status;

-- Voir l'historique des exécutions
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'fetch-rss-feeds')
ORDER BY start_time DESC
LIMIT 10;

-- Voir les logs de fetch
SELECT * FROM rss_fetch_logs 
ORDER BY started_at DESC 
LIMIT 10;
```

## 🔧 Configuration

### Ajouter une Nouvelle Source RSS

```sql
INSERT INTO sources (name, url, rss_url, type, is_active) VALUES
  ('Nom de la source', 'https://example.com', 'https://example.com/feed.xml', 'rss', true);
```

### Désactiver une Source

```sql
UPDATE sources 
SET is_active = false 
WHERE name = 'Nom de la source';
```

### Modifier la Fréquence du Cron

```sql
-- Changer pour toutes les 4 heures
SELECT cron.alter_job(
  job_id := (SELECT jobid FROM cron.job WHERE jobname = 'fetch-rss-feeds'),
  schedule := '0 */4 * * *'
);

-- Changer pour tous les jours à 6h du matin
SELECT cron.alter_job(
  job_id := (SELECT jobid FROM cron.job WHERE jobname = 'fetch-rss-feeds'),
  schedule := '0 6 * * *'
);
```

## 📊 Monitoring

### Voir les Articles Récents

```sql
SELECT 
  a.title,
  a.published_at,
  s.name as source_name,
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
  s.fetch_error_count,
  COUNT(a.id) as article_count
FROM sources s
LEFT JOIN articles a ON s.id = a.source_id
WHERE s.type = 'rss'
GROUP BY s.id, s.name, s.last_fetch_date, s.fetch_error_count
ORDER BY article_count DESC;
```

### Sources en Erreur

```sql
SELECT 
  name,
  fetch_error_count,
  last_error_message,
  last_fetch_date
FROM sources
WHERE fetch_error_count > 0
ORDER BY fetch_error_count DESC;
```

## 🐛 Dépannage

### Le Cron ne se déclenche pas

1. Vérifiez que pg_cron est activé :
```sql
SELECT * FROM pg_extension WHERE extname = 'pg_cron';
```

2. Vérifiez les permissions :
```sql
SELECT * FROM cron.job WHERE jobname = 'fetch-rss-feeds';
```

### La Fonction retourne des erreurs

1. Consultez les logs de la fonction :
   - Dashboard Supabase → Edge Functions → fetch-rss → Logs

2. Testez manuellement une source :
```bash
curl 'https://www.technologyreview.com/feed/'
```

### Pas de nouveaux articles

1. Vérifiez que les sources sont actives :
```sql
SELECT name, is_active, last_fetch_date FROM sources WHERE type = 'rss';
```

2. Vérifiez les doublons :
```sql
SELECT canonical_url, COUNT(*) 
FROM articles 
GROUP BY canonical_url 
HAVING COUNT(*) > 1;
```

## 📝 Structure des Données

### Table `sources`

| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid | Identifiant unique |
| name | varchar | Nom de la source |
| url | text | URL du site |
| rss_url | text | URL du flux RSS |
| type | varchar | Type (rss, api, scraping) |
| is_active | boolean | Source active ou non |
| last_fetch_date | timestamptz | Dernière collecte réussie |
| fetch_status | varchar | Statut (active, paused, error) |
| fetch_error_count | integer | Nombre d'erreurs consécutives |
| last_error_message | text | Dernier message d'erreur |

### Table `articles`

| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid | Identifiant unique |
| title | varchar(500) | Titre de l'article |
| url | text | URL de l'article |
| canonical_url | text | URL canonique (déduplication) |
| rss_guid | text | GUID du flux RSS (déduplication) |
| excerpt | text | Résumé court |
| content | text | Contenu complet |
| source_id | uuid | Référence à la source |
| source_url | text | URL du site source |
| published_at | timestamptz | Date de publication |
| created_at | timestamptz | Date d'insertion |
| author | varchar(200) | Auteur |
| image_url | text | URL de l'image |

## 🚀 Améliorations Futures

- [ ] Catégorisation automatique des articles par IA
- [ ] Extraction de mots-clés
- [ ] Scoring de pertinence
- [ ] Notification en temps réel
- [ ] Dashboard de monitoring
- [ ] API REST pour accéder aux articles
- [ ] Webhook pour les nouveaux articles

## 📚 Ressources

- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [pg_cron Documentation](https://github.com/citusdata/pg_cron)
- [RSS Parser](https://www.npmjs.com/package/rss-parser)
- [Deno Documentation](https://deno.land/manual)
