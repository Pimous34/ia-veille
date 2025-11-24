# 🚀 Déploiement Rapide du JT Quotidien

Guide de déploiement en 5 étapes pour mettre en place le système de JT vidéo automatique.

## ✅ Étape 1 : Obtenir une clé API D-ID

1. Créez un compte sur [D-ID](https://www.d-id.com/)
2. Allez dans **Settings** > **API Keys**
3. Créez une nouvelle clé API
4. Copiez la clé (format : `Basic xxx...`)

## ✅ Étape 2 : Préparer l'image du présentateur

### Option A : Utiliser une image D-ID pré-approuvée

```
https://create-images-results.d-id.com/default_presenter.jpg
```

### Option B : Upload votre propre image

1. Choisissez une photo professionnelle (visage bien visible, fond neutre)
2. Uploadez dans Supabase Storage :

```bash
# Créer un bucket public
supabase storage create presenter --public

# Upload l'image
supabase storage upload presenter/presenter.jpg ./presenter.jpg
```

3. Récupérez l'URL publique

## ✅ Étape 3 : Configurer les variables d'environnement

### Dans votre projet local (`.env.local`)

```bash
# Copier le fichier exemple
cp env.example .env.local

# Éditer et ajouter vos clés
D_ID_API_KEY=Basic_YOUR_KEY_HERE
JT_PRESENTER_IMAGE_URL=https://your-image-url.jpg
```

### Dans Supabase Edge Functions

```bash
# Configurer les secrets
supabase secrets set D_ID_API_KEY="Basic YOUR_KEY_HERE"
supabase secrets set JT_PRESENTER_IMAGE_URL="https://your-image-url.jpg"
```

## ✅ Étape 4 : Déployer la base de données et les fonctions

### 4.1 Appliquer la migration

```bash
# Se connecter à Supabase
supabase link --project-ref YOUR_PROJECT_REF

# Appliquer la migration
supabase db push
```

### 4.2 Déployer les Edge Functions

```bash
# Déployer toutes les fonctions
supabase functions deploy select-daily-news
supabase functions deploy generate-daily-jt

# Vérifier le déploiement
supabase functions list
```

## ✅ Étape 5 : Configurer le Cron

### Option A : pg_cron (Recommandé)

1. Dans le Dashboard Supabase, allez dans **Database** > **Extensions**
2. Activez `pg_cron`
3. Exécutez ce SQL dans l'éditeur SQL :

```sql
-- Agrégation RSS toutes les 8 heures
SELECT cron.schedule(
  'fetch-rss-feeds',
  '0 */8 * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/fetch-rss',
    headers := jsonb_build_object(
      'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY',
      'Content-Type', 'application/json'
    )
  );
  $$
);

-- Sélection et génération du JT à 18h
SELECT cron.schedule(
  'select-daily-news',
  '0 18 * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/select-daily-news',
    headers := jsonb_build_object(
      'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY',
      'Content-Type', 'application/json'
    )
  );
  $$
);
```

### Option B : GitHub Actions

Créez `.github/workflows/daily-jt.yml` :

```yaml
name: Daily JT Generation

on:
  schedule:
    # 18h UTC = 19h Paris (hiver) ou 20h Paris (été)
    - cron: "0 18 * * *"
  workflow_dispatch: # Permet déclenchement manuel

jobs:
  generate-jt:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Daily News Selection
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}" \
            -H "Content-Type: application/json" \
            ${{ secrets.SUPABASE_URL }}/functions/v1/select-daily-news
```

Puis ajoutez les secrets dans GitHub :

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## 🧪 Test du système

### Test manuel immédiat

```bash
# 1. Déclencher la sélection des news
curl -X POST \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  https://YOUR_PROJECT_REF.supabase.co/functions/v1/select-daily-news

# 2. Vérifier les logs
supabase functions logs select-daily-news --tail

# 3. Vérifier dans la base de données
# Connectez-vous au Dashboard Supabase > SQL Editor
SELECT * FROM daily_news_videos ORDER BY created_at DESC LIMIT 1;
```

### Vérifier que tout fonctionne

1. **Articles agrégés** : Vérifiez qu'il y a des articles récents

   ```sql
   SELECT COUNT(*) FROM articles
   WHERE published_at > NOW() - INTERVAL '24 hours';
   ```

2. **Articles sélectionnés** : Vérifiez les articles marqués

   ```sql
   SELECT * FROM articles
   WHERE is_daily_news = true
   ORDER BY relevance_score DESC;
   ```

3. **JT généré** : Vérifiez le statut
   ```sql
   SELECT id, date, title, status, video_url
   FROM daily_news_videos
   ORDER BY date DESC LIMIT 1;
   ```

## 📊 Monitoring

### Dashboard Supabase

- **Edge Functions** > Logs : Voir les exécutions
- **Database** > Table Editor : Vérifier les données
- **SQL Editor** : Requêtes personnalisées

### Vérifier le cron

```sql
-- Voir les tâches planifiées
SELECT * FROM cron.job;

-- Voir l'historique d'exécution
SELECT * FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 10;
```

## 🎯 Prochaines étapes

1. **Personnaliser le script** : Modifiez `generateJTScript()` dans `generate-daily-jt/index.ts`
2. **Ajuster le scoring** : Modifiez `calculateRelevanceScore()` dans `select-daily-news/index.ts`
3. **Changer la voix** : Modifiez `voice_id` dans la config D-ID
4. **Ajouter des sources RSS** : Insérez dans la table `sources`

## ❓ Besoin d'aide ?

- 📖 Documentation complète : `docs/DAILY_JT_SYSTEM.md`
- 🔧 Configuration Cron : `docs/CRON_CONFIGURATION.md`
- 🐛 Issues : Vérifiez les logs des Edge Functions

## 🎉 C'est prêt !

Votre premier JT sera généré automatiquement ce soir à 18h UTC (19h/20h Paris).

Pour tester immédiatement, exécutez :

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  https://YOUR_PROJECT_REF.supabase.co/functions/v1/select-daily-news
```

Puis rendez-vous sur `/jt` pour voir le résultat ! 🚀
