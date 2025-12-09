# 🎬 Intégration du Jingle Vidéo dans les JT

## Vue d'ensemble

Chaque JT généré commence maintenant par un jingle vidéo d'introduction avant le contenu principal généré par D-ID. Le système concatène automatiquement :

1. **Jingle d'introduction** (`Jingle.mp4`) - Vidéo d'intro de votre choix
2. **Vidéo JT principale** - Générée par D-ID avec l'image du présentateur

## Architecture

### Flux de génération

```
1. Sélection des articles (select-daily-news)
   ↓
2. Génération du script JT (generate-daily-jt)
   ↓
3. Création vidéo D-ID avec image présentateur
   ↓
4. Téléchargement du jingle depuis Supabase Storage
   ↓
5. Téléchargement de la vidéo D-ID
   ↓
6. Concaténation avec FFmpeg
   ↓
7. Upload de la vidéo finale sur Supabase Storage
   ↓
8. Publication sur /jt
```

## Configuration requise

### 1. Assets nécessaires

- **Image du présentateur** : `public/image/Gretta JT.jpg`
  - Format : JPG
  - Résolution recommandée : 512x512px minimum
  - Fond neutre, visage visible
  
- **Jingle vidéo** : `public/video/Jingle.mp4`
  - Format : MP4
  - Durée recommandée : 5-10 secondes
  - Codec : H.264 (pour compatibilité maximale)

### 2. Variables d'environnement

Dans `.env.local` :

```bash
# Clé API D-ID
D_ID_API_KEY=votre_email:votre_cle_api

# URL de l'image du présentateur (sera uploadée sur Supabase Storage)
JT_PRESENTER_IMAGE_URL=/image/Gretta JT.jpg

# Chemin du jingle (sera uploadé sur Supabase Storage)
JT_JINGLE_VIDEO_PATH=/video/Jingle.mp4
```

### 3. Supabase Storage

Le système utilise un bucket `jt-assets` avec la structure suivante :

```
jt-assets/
├── presenter/
│   └── gretta-jt.jpg          # Image du présentateur
├── jingle/
│   └── jingle.mp4              # Jingle d'introduction
└── videos/
    ├── jt-2024-11-24.mp4       # JT final (jingle + D-ID)
    ├── jt-2024-11-25.mp4
    └── ...
```

## Installation et déploiement

### Étape 1 : Upload des assets

Exécutez le script PowerShell pour uploader les assets sur Supabase Storage :

```powershell
cd "D:\Ai Quick Feed\ia-veille"
.\scripts\upload-jt-assets.ps1
```

Ce script va :
- ✅ Créer le bucket `jt-assets` s'il n'existe pas
- ✅ Uploader l'image du présentateur
- ✅ Uploader le jingle vidéo
- ✅ Afficher les URLs publiques

### Étape 2 : Mettre à jour les variables d'environnement

Après l'upload, mettez à jour `.env.local` avec les URLs complètes :

```bash
JT_PRESENTER_IMAGE_URL=https://jrlecaepyoivtplpvwoe.supabase.co/storage/v1/object/public/jt-assets/presenter/gretta-jt.jpg
```

### Étape 3 : Configurer les secrets Supabase

Pour les Edge Functions, configurez les secrets :

```bash
supabase secrets set D_ID_API_KEY="votre_email:votre_cle_api"
supabase secrets set JT_PRESENTER_IMAGE_URL="https://votre-url-supabase/storage/v1/object/public/jt-assets/presenter/gretta-jt.jpg"
```

### Étape 4 : Déployer la fonction mise à jour

```bash
supabase functions deploy generate-daily-jt
```

## Fonctionnement technique

### Concaténation vidéo avec FFmpeg

La fonction `mergeVideosAndUpload()` dans `generate-daily-jt/index.ts` :

1. **Télécharge** le jingle et la vidéo D-ID
2. **Crée** des fichiers temporaires dans `/tmp`
3. **Génère** un fichier de liste pour FFmpeg
4. **Exécute** FFmpeg avec le filtre `concat`
5. **Upload** la vidéo finale sur Supabase Storage
6. **Nettoie** les fichiers temporaires

### Commande FFmpeg utilisée

```bash
ffmpeg -f concat -safe 0 -i concat_list.txt -c copy output.mp4
```

Options :
- `-f concat` : Utilise le démultiplexeur concat
- `-safe 0` : Permet les chemins absolus
- `-c copy` : Copie les streams sans réencodage (rapide)

## Personnalisation

### Changer le jingle

1. Remplacez `public/video/Jingle.mp4` par votre nouveau jingle
2. Exécutez le script d'upload :
   ```powershell
   .\scripts\upload-jt-assets.ps1
   ```

### Changer l'image du présentateur

1. Remplacez `public/image/Gretta JT.jpg` par votre nouvelle image
2. Exécutez le script d'upload :
   ```powershell
   .\scripts\upload-jt-assets.ps1
   ```

### Modifier la durée du jingle

Le jingle peut avoir n'importe quelle durée. Recommandations :
- **Court** (5-10s) : Pour un JT dynamique
- **Moyen** (10-20s) : Pour une intro plus élaborée
- **Long** (20-30s) : Pour un générique complet

⚠️ **Attention** : La durée totale du JT sera `durée_jingle + durée_vidéo_D-ID`

## Résolution de problèmes

### Erreur : "FFmpeg not found"

Les Edge Functions Supabase incluent FFmpeg par défaut. Si l'erreur persiste :
- Vérifiez les logs de la fonction : `supabase functions logs generate-daily-jt`
- Contactez le support Supabase

### Erreur : "Failed to upload merged video"

Vérifications :
1. Le bucket `jt-assets` existe et est public
2. Les permissions de stockage sont correctes
3. La taille du fichier ne dépasse pas 50MB

### La vidéo finale ne se lit pas

Causes possibles :
1. **Codecs incompatibles** : Assurez-vous que le jingle et la vidéo D-ID utilisent le même codec (H.264)
2. **Résolutions différentes** : Utilisez FFmpeg pour normaliser les résolutions

Solution : Réencodez le jingle avec :
```bash
ffmpeg -i Jingle.mp4 -c:v libx264 -c:a aac -strict experimental Jingle_normalized.mp4
```

## Monitoring

### Logs de génération

Suivez la génération en temps réel :

```bash
supabase functions logs generate-daily-jt --tail
```

Étapes attendues :
1. `🎥 Creating video with D-ID...`
2. `✅ D-ID talk created: xxx`
3. `📊 Video status: processing`
4. `✅ Video ready!`
5. `🎬 Downloading jingle video...`
6. `🎬 Downloading main video...`
7. `🎬 Merging videos with FFmpeg...`
8. `✅ Videos merged successfully`
9. `📤 Uploading merged video to Supabase Storage...`
10. `✅ Merged video uploaded`

### Durée de génération

Temps estimé :
- Génération D-ID : 2-5 minutes
- Téléchargement vidéos : 10-30 secondes
- Concaténation FFmpeg : 5-15 secondes
- Upload final : 10-30 secondes

**Total** : ~3-6 minutes par JT

## Coûts

### D-ID
- 1 crédit par seconde de vidéo
- JT de 3 minutes = ~180 crédits
- Plan Lite (120 crédits/mois) = insuffisant
- **Recommandation** : Plan Pro (360 crédits/mois) = 2 JT/mois

### Supabase Storage
- Stockage : Gratuit jusqu'à 1GB
- Bande passante : Gratuit jusqu'à 2GB/mois
- Estimation : ~100MB par JT final
- **Recommandation** : Plan gratuit suffisant pour 10 JT/mois

## Sécurité

### Bonnes pratiques

1. **Ne jamais commiter** `.env.local` dans Git
2. **Utiliser** les secrets Supabase pour les clés API
3. **Configurer** les permissions du bucket en lecture seule publique
4. **Limiter** la taille des uploads (50MB max)

### Permissions du bucket

```sql
-- Lecture publique, écriture service role uniquement
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'jt-assets');

CREATE POLICY "Service role write access"
ON storage.objects FOR INSERT
USING (bucket_id = 'jt-assets' AND auth.role() = 'service_role');
```

## Support

Pour toute question :
1. Consultez les logs : `supabase functions logs generate-daily-jt`
2. Vérifiez la documentation D-ID : https://docs.d-id.com
3. Consultez la documentation Supabase Storage : https://supabase.com/docs/guides/storage
