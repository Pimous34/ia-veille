# 🎥 Système de JT Vidéo Quotidien - Résumé de l'implémentation

## ✅ Ce qui a été créé

### 1. **Base de données** 📊

#### Modifications de la table `articles`

- `is_daily_news` (BOOLEAN) - Marque les articles sélectionnés pour le JT
- `daily_news_date` (DATE) - Date de sélection
- `relevance_score` (DECIMAL) - Score de pertinence (0-100)

#### Nouvelle table `daily_news_videos`

- Stocke tous les JT générés
- Champs principaux : `video_url`, `thumbnail_url`, `duration`, `status`
- Métadonnées D-ID : `d_id_talk_id`, `d_id_result`
- Tracking : `view_count`, `article_ids`

**Fichiers:**

- `supabase/schema.sql` - Schéma mis à jour
- `supabase/migrations/20251124_add_daily_jt_system.sql` - Migration
- `supabase/migrations/seed_ai_sources.sql` - Sources RSS recommandées

### 2. **Edge Functions Supabase** ⚡

#### `select-daily-news`

- **Déclenchement:** Cron quotidien à 18h UTC
- **Fonction:** Analyse les articles des dernières 24h et sélectionne les 6 meilleurs
- **Algorithme de scoring:**
  - Fraîcheur (0-40 pts)
  - Engagement/vues (0-30 pts)
  - Qualité du contenu (0-20 pts)
  - Titre accrocheur (0-10 pts)
- **Sortie:** Marque les articles et déclenche `generate-daily-jt`

#### `generate-daily-jt`

- **Déclenchement:** Appelé automatiquement par `select-daily-news`
- **Fonction:** Génère le script du JT et crée la vidéo avec D-ID
- **Processus:**
  1. Génère un script structuré en français
  2. Appelle l'API D-ID avec voix française (fr-FR-DeniseNeural)
  3. Polling jusqu'à completion (max 5 minutes)
  4. Stocke l'URL de la vidéo en base
- **Format:** MP4, ~3 minutes, optimisé qualité/poids

**Fichiers:**

- `supabase/functions/select-daily-news/index.ts`
- `supabase/functions/generate-daily-jt/index.ts`

### 3. **Frontend Next.js** 🎨

#### Page `/jt` - Liste des JT

- Affichage de tous les JT complétés
- Design moderne avec badges "News du Jour"
- Tri par date décroissante
- États de chargement et erreurs
- Compteurs de vues et nombre d'articles

#### Types TypeScript

- Interface `DailyNewsVideo` complète
- Extension de l'interface `Article`

**Fichiers:**

- `src/app/jt/page.tsx` - Page liste (mise à jour)
- `src/types/database.ts` - Types TypeScript (mis à jour)

### 4. **Configuration** ⚙️

#### Variables d'environnement

```bash
D_ID_API_KEY=Basic_xxx
JT_PRESENTER_IMAGE_URL=https://xxx.jpg
```

**Fichiers:**

- `env.example` - Template mis à jour

### 5. **Documentation** 📚

#### Guides complets

1. **DAILY_JT_SYSTEM.md** - Documentation technique complète

   - Architecture détaillée
   - Algorithmes de scoring
   - Configuration D-ID
   - Monitoring et debugging
   - Coûts et optimisations

2. **QUICK_START_JT.md** - Guide de déploiement rapide

   - 5 étapes pour démarrer
   - Commandes prêtes à l'emploi
   - Tests et vérifications

3. **CRON_CONFIGURATION.md** - Configuration des tâches automatiques
   - pg_cron (recommandé)
   - GitHub Actions
   - Vercel Cron

**Fichiers:**

- `docs/DAILY_JT_SYSTEM.md`
- `docs/QUICK_START_JT.md`
- `docs/CRON_CONFIGURATION.md`

### 6. **Scripts de test** 🧪

**Fichiers:**

- `scripts/test-jt-system.sh` - Script de test automatisé

## 🚀 Prochaines étapes pour le déploiement

### 1. Obtenir une clé API D-ID

- Créer un compte sur [d-id.com](https://www.d-id.com)
- Générer une clé API
- Budget recommandé : Plan Lite (120 crédits/mois)

### 2. Préparer l'image du présentateur

- Photo professionnelle avec visage visible
- Fond neutre
- Résolution minimum 512x512px
- Upload sur Supabase Storage ou CDN

### 3. Configurer les variables d'environnement

```bash
supabase secrets set D_ID_API_KEY="Basic YOUR_KEY"
supabase secrets set JT_PRESENTER_IMAGE_URL="https://your-image.jpg"
```

### 4. Déployer

```bash
# Migration de la base de données
supabase db push

# Déploiement des Edge Functions
supabase functions deploy select-daily-news
supabase functions deploy generate-daily-jt

# Ajouter les sources RSS
# Exécuter seed_ai_sources.sql dans le SQL Editor
```

### 5. Configurer le Cron

Voir `docs/CRON_CONFIGURATION.md` pour les options

### 6. Tester

```bash
# Test manuel
curl -X POST \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  https://YOUR_PROJECT.supabase.co/functions/v1/select-daily-news
```

## 📊 Fonctionnement quotidien

```
00:00, 08:00, 16:00 UTC → Agrégation RSS (fetch-rss)
18:00 UTC → Sélection des news (select-daily-news)
18:00-18:05 UTC → Génération vidéo (generate-daily-jt)
18:05+ UTC → JT disponible sur /jt
```

## 🎯 Caractéristiques clés

✅ **Automatique** - Aucune intervention manuelle requise
✅ **Intelligent** - Algorithme de scoring multi-critères
✅ **Optimisé** - Format MP4, ~3 minutes, qualité/poids optimal
✅ **Français** - Voix professionnelle française (Microsoft Azure)
✅ **Scalable** - Gère des milliers d'articles
✅ **Monitorable** - Logs complets et statuts détaillés
✅ **Responsive** - Interface adaptée mobile/desktop

## 💡 Personnalisations possibles

- **Voix** : Changer `voice_id` dans `generate-daily-jt/index.ts`
- **Nombre d'articles** : Modifier `.slice(0, 6)` dans `select-daily-news/index.ts`
- **Scoring** : Ajuster les poids dans `calculateRelevanceScore()`
- **Horaire** : Modifier le cron (actuellement 18h UTC)
- **Script** : Personnaliser `generateJTScript()` dans `generate-daily-jt/index.ts`

## 📞 Support

- Documentation complète : `docs/DAILY_JT_SYSTEM.md`
- Guide rapide : `docs/QUICK_START_JT.md`
- Configuration Cron : `docs/CRON_CONFIGURATION.md`

## 🎉 Résultat attendu

Chaque jour à 18h UTC, le système :

1. ✅ Analyse tous les articles de la journée
2. ✅ Sélectionne les 6 plus pertinents
3. ✅ Génère un script de JT professionnel
4. ✅ Crée une vidéo de ~3 minutes avec D-ID
5. ✅ Publie automatiquement sur `/jt`

**Le JT est prêt à être visionné 5 minutes après le déclenchement !** 🚀
