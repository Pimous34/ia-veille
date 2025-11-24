# Configuration Cron pour Supabase Edge Functions

## Planification des tâches automatiques

Pour configurer les tâches cron dans Supabase, vous devez utiliser l'extension `pg_cron`.

### 1. Activer pg_cron dans Supabase

Dans le Dashboard Supabase :

1. Allez dans **Database** > **Extensions**
2. Recherchez `pg_cron`
3. Activez l'extension

### 2. Configurer les tâches cron

Exécutez les commandes SQL suivantes dans l'éditeur SQL de Supabase :

```sql
-- Activer l'extension pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Tâche 1: Agrégation RSS toutes les 8 heures
SELECT cron.schedule(
  'fetch-rss-feeds',
  '0 */8 * * *', -- Toutes les 8 heures
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

-- Tâche 2: Sélection des news du jour à 18h00 (après l'agrégation de la journée)
SELECT cron.schedule(
  'select-daily-news',
  '0 18 * * *', -- Tous les jours à 18h00
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

### 3. Vérifier les tâches cron

```sql
-- Voir toutes les tâches cron
SELECT * FROM cron.job;

-- Voir l'historique d'exécution
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
```

### 4. Supprimer une tâche cron (si nécessaire)

```sql
-- Supprimer par nom
SELECT cron.unschedule('fetch-rss-feeds');
SELECT cron.unschedule('select-daily-news');
```

## Alternative : Utiliser Supabase Cron (Beta)

Si pg_cron n'est pas disponible, vous pouvez utiliser les webhooks externes :

### Option A : GitHub Actions

Créez `.github/workflows/daily-jt.yml` :

```yaml
name: Daily JT Generation

on:
  schedule:
    - cron: "0 18 * * *" # 18h00 UTC tous les jours

jobs:
  generate-jt:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger select-daily-news
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}" \
            -H "Content-Type: application/json" \
            https://YOUR_PROJECT_REF.supabase.co/functions/v1/select-daily-news
```

### Option B : Vercel Cron (si déployé sur Vercel)

Dans `vercel.json` :

```json
{
  "crons": [
    {
      "path": "/api/cron/daily-jt",
      "schedule": "0 18 * * *"
    }
  ]
}
```

Puis créez `pages/api/cron/daily-jt.ts` qui appelle votre Edge Function.

## Notes importantes

- **Fuseau horaire** : Les heures sont en UTC. Ajustez selon votre fuseau horaire.
- **Ordre d'exécution** :

  1. `fetch-rss` s'exécute toutes les 8h (0h, 8h, 16h UTC)
  2. `select-daily-news` s'exécute à 18h UTC (après la dernière agrégation)
  3. `generate-daily-jt` est appelé automatiquement par `select-daily-news`

- **Monitoring** : Surveillez les logs dans Supabase Dashboard > Edge Functions > Logs
