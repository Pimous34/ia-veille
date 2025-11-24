# Système de JT Vidéo Quotidien avec D-ID

## 📋 Vue d'ensemble

Ce système génère automatiquement un Journal Télévisé (JT) vidéo de 3 minutes chaque jour à partir des articles les plus pertinents agrégés dans la journée. Il utilise l'API D-ID pour créer des vidéos avec un présentateur virtuel parlant en français.

## 🏗️ Architecture

### Composants principaux

1. **Base de données**

   - Table `articles` : Articles agrégés avec champs `is_daily_news`, `daily_news_date`, `relevance_score`
   - Table `daily_news_videos` : Stockage des JT générés

2. **Edge Functions Supabase**

   - `fetch-rss` : Agrégation RSS (toutes les 8h)
   - `select-daily-news` : Sélection des articles pertinents (18h quotidien)
   - `generate-daily-jt` : Génération de la vidéo avec D-ID

3. **Frontend Next.js**
   - `/jt` : Liste des JT
   - `/jt/[slug]` : Lecteur vidéo du JT

## 🔄 Flux de travail automatique

```
08:00, 16:00, 00:00 UTC
    ↓
[fetch-rss] Agrégation des articles RSS
    ↓
18:00 UTC (quotidien)
    ↓
[select-daily-news] Sélection des 6 meilleurs articles
    ↓ (calcul du score de pertinence)
    ↓
[generate-daily-jt] Génération du script
    ↓
[D-ID API] Création de la vidéo
    ↓ (polling jusqu'à completion)
    ↓
Vidéo disponible sur /jt
```

## 📊 Algorithme de sélection des articles

Le score de pertinence (0-100) est calculé selon :

### 1. Fraîcheur (0-40 points)

- ≤ 6h : 40 points
- ≤ 12h : 30 points
- ≤ 24h : 20 points
- ≤ 48h : 10 points

### 2. Engagement (0-30 points)

- Basé sur `view_count`
- Formule : `min(30, (view_count / 10) * 5)`

### 3. Qualité du contenu (0-20 points)

- Image présente : +10 points
- Contenu > 500 caractères : +10 points
- Contenu > 200 caractères : +5 points

### 4. Titre accrocheur (0-10 points)

- Mots-clés : "nouveau", "révolution", "innovation", "découverte", "important", "majeur", "exclusif"

## 🎬 Génération de la vidéo avec D-ID

### Configuration D-ID

```typescript
{
  source_url: "URL_IMAGE_PRESENTATEUR",
  script: {
    type: "text",
    input: "SCRIPT_GENERE",
    provider: {
      type: "microsoft",
      voice_id: "fr-FR-DeniseNeural" // Voix française professionnelle
    }
  },
  config: {
    result_format: "mp4",
    fluent: true,
    pad_audio: 0,
    stitch: true
  }
}
```

### Format du script

```
Bonjour et bienvenue dans votre journal de l'IA du [DATE].
Aujourd'hui, nous avons sélectionné pour vous [N] actualités majeures...

Article numéro 1. [TITRE]. [EXTRAIT]...
Article numéro 2. [TITRE]. [EXTRAIT]...
...

Voilà pour les actualités du jour. Retrouvez tous ces articles en détail sur notre plateforme.
À très bientôt pour de nouvelles actualités de l'intelligence artificielle !
```

### Optimisation qualité/poids

- **Format** : MP4 (H.264)
- **Résolution** : 512x512 (par défaut D-ID)
- **Durée cible** : ~3 minutes (6 articles × 30 secondes)
- **Voix** : Microsoft Azure TTS (qualité supérieure)
- **Fluent mode** : Activé pour des transitions naturelles

## 🚀 Installation et configuration

### 1. Prérequis

- Compte Supabase
- Compte D-ID avec API Key
- Image du présentateur (JPG/PNG, visage bien visible)

### 2. Variables d'environnement

Ajoutez dans `.env.local` et dans Supabase Edge Functions :

```bash
# D-ID Configuration
D_ID_API_KEY=your_d_id_api_key_here
JT_PRESENTER_IMAGE_URL=https://your-cdn.com/presenter.jpg
```

### 3. Migration de la base de données

```bash
# Appliquer la migration
supabase db push

# Ou exécuter manuellement
psql -h db.xxx.supabase.co -U postgres -d postgres -f supabase/migrations/20251124_add_daily_jt_system.sql
```

### 4. Déployer les Edge Functions

```bash
# Déployer toutes les fonctions
supabase functions deploy select-daily-news
supabase functions deploy generate-daily-jt

# Configurer les secrets
supabase secrets set D_ID_API_KEY=your_key_here
supabase secrets set JT_PRESENTER_IMAGE_URL=your_image_url_here
```

### 5. Configurer le Cron

Voir `docs/CRON_CONFIGURATION.md` pour les instructions détaillées.

## 🎨 Image du présentateur

### Recommandations

- **Format** : JPG ou PNG
- **Résolution** : Minimum 512x512px
- **Composition** :
  - Visage bien visible et centré
  - Fond neutre ou professionnel
  - Éclairage uniforme
  - Expression neutre ou souriante
  - Pas de lunettes de soleil

### Où héberger l'image ?

1. **Supabase Storage** (recommandé)

   ```bash
   # Upload dans le bucket public
   supabase storage upload presenter presenter.jpg
   ```

2. **CDN externe** (Cloudinary, Imgur, etc.)

3. **D-ID Presenters** (images pré-approuvées)
   - Voir : https://studio.d-id.com/agents

## 📱 Interface utilisateur

### Page liste des JT (`/jt`)

- Affiche tous les JT complétés
- Tri par date décroissante
- Badge "News du Jour"
- Compteur de vues
- Nombre d'articles

### Page lecteur (`/jt/[slug]`)

- Lecteur vidéo HTML5
- Liste des articles sources
- Partage social
- Transcription du script

## 🔍 Monitoring et debugging

### Vérifier les logs

```bash
# Logs des Edge Functions
supabase functions logs select-daily-news
supabase functions logs generate-daily-jt

# Logs en temps réel
supabase functions logs --tail
```

### Vérifier les JT générés

```sql
-- Voir tous les JT
SELECT * FROM daily_news_videos ORDER BY date DESC;

-- Voir les JT en échec
SELECT * FROM daily_news_videos WHERE status = 'failed';

-- Voir les articles sélectionnés aujourd'hui
SELECT * FROM articles WHERE is_daily_news = true ORDER BY relevance_score DESC;
```

### Tester manuellement

```bash
# Déclencher la sélection des news
curl -X POST \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  https://YOUR_PROJECT.supabase.co/functions/v1/select-daily-news

# Déclencher la génération (avec date spécifique)
curl -X POST \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"date":"2025-11-24","article_ids":["uuid1","uuid2"]}' \
  https://YOUR_PROJECT.supabase.co/functions/v1/generate-daily-jt
```

## 💰 Coûts D-ID

### Tarification (approximative)

- **Starter** : 20 crédits/mois gratuits
- **1 crédit** = 1 vidéo de ~1 minute
- **JT de 3 minutes** = ~3 crédits
- **Coût mensuel** : ~90 crédits (30 JT × 3 crédits)

### Plans recommandés

- **Lite** : 120 crédits/mois (~40 JT)
- **Basic** : 300 crédits/mois (~100 JT)

## 🐛 Problèmes courants

### La vidéo ne se génère pas

1. Vérifier la clé API D-ID
2. Vérifier que l'image du présentateur est accessible
3. Vérifier les logs de `generate-daily-jt`
4. Vérifier le quota D-ID

### Aucun article sélectionné

1. Vérifier que `fetch-rss` fonctionne
2. Vérifier qu'il y a des articles récents (< 48h)
3. Ajuster l'algorithme de scoring si nécessaire

### Le cron ne s'exécute pas

1. Vérifier que `pg_cron` est activé
2. Vérifier les tâches : `SELECT * FROM cron.job;`
3. Utiliser une alternative (GitHub Actions, Vercel Cron)

## 🔮 Améliorations futures

- [ ] Personnalisation de la voix (masculine/féminine)
- [ ] Sous-titres automatiques
- [ ] Chapitres vidéo par article
- [ ] Miniatures personnalisées avec l'image de l'article principal
- [ ] Notification push quand le JT est prêt
- [ ] Playlist YouTube automatique
- [ ] Analyse de sentiment pour adapter le ton
- [ ] Support multi-langues

## 📚 Ressources

- [Documentation D-ID](https://docs.d-id.com/)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [pg_cron Documentation](https://github.com/citusdata/pg_cron)
