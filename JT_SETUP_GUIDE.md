# 🎬 Guide de Configuration du Système JT avec Jingle

## Configuration effectuée ✅

### 1. Clé API D-ID
- ✅ Clé API configurée dans `.env.local`
- ✅ Format : `email:api_key`
- ✅ Valeur : `YmVuamFtaW4ucmlnb3VzdGVAZ21haWwuY29t:2EzsU0X9S7PWyOuI9dPBx`

### 2. Assets JT
- ✅ Image du présentateur : `public/image/Gretta JT.jpg`
- ✅ Jingle vidéo : `public/video/Jingle.mp4`

### 3. Modifications du code
- ✅ Fonction `generate-daily-jt` mise à jour pour :
  - Uploader l'image du présentateur sur Supabase Storage
  - Uploader le jingle sur Supabase Storage
  - Concaténer le jingle avec la vidéo D-ID générée
  - Uploader la vidéo finale sur Supabase Storage

## Prochaines étapes 🚀

### Étape 1 : Upload des assets sur Supabase Storage

Exécutez le script PowerShell pour uploader les fichiers :

```powershell
cd "D:\Ai Quick Feed\ia-veille"
.\scripts\upload-jt-assets.ps1
```

Ce script va :
1. Créer le bucket `jt-assets` sur Supabase Storage
2. Uploader l'image du présentateur (`Gretta JT.jpg`)
3. Uploader le jingle vidéo (`Jingle.mp4`)
4. Afficher les URLs publiques des fichiers

### Étape 2 : Mettre à jour les variables d'environnement

Après l'upload, le script affichera les URLs. Mettez à jour `.env.local` :

```bash
JT_PRESENTER_IMAGE_URL=https://jrlecaepyoivtplpvwoe.supabase.co/storage/v1/object/public/jt-assets/presenter/gretta-jt.jpg
```

### Étape 3 : Configurer les secrets Supabase

Pour les Edge Functions, configurez les secrets :

```bash
# Installer Supabase CLI si ce n'est pas déjà fait
npm install -g supabase

# Se connecter à Supabase
supabase login

# Lier le projet
supabase link --project-ref jrlecaepyoivtplpvwoe

# Configurer les secrets
supabase secrets set D_ID_API_KEY="YmVuamFtaW4ucmlnb3VzdGVAZ21haWwuY29t:2EzsU0X9S7PWyOuI9dPBx"
supabase secrets set JT_PRESENTER_IMAGE_URL="https://jrlecaepyoivtplpvwoe.supabase.co/storage/v1/object/public/jt-assets/presenter/gretta-jt.jpg"
```

### Étape 4 : Déployer les Edge Functions

```bash
# Déployer la fonction generate-daily-jt mise à jour
supabase functions deploy generate-daily-jt

# Déployer la fonction upload-jt-assets (optionnel)
supabase functions deploy upload-jt-assets
```

### Étape 5 : Tester le système

#### Test manuel de génération de JT

```bash
# Appeler la fonction select-daily-news qui déclenchera generate-daily-jt
curl -X POST \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  https://jrlecaepyoivtplpvwoe.supabase.co/functions/v1/select-daily-news
```

#### Vérifier les logs

```bash
# Suivre les logs en temps réel
supabase functions logs generate-daily-jt --tail
```

Vous devriez voir :
1. `🎥 Creating video with D-ID...`
2. `✅ D-ID talk created`
3. `📊 Video status: processing`
4. `✅ Video ready!`
5. `🎬 Downloading jingle video...`
6. `🎬 Downloading main video...`
7. `🎬 Merging videos with FFmpeg...`
8. `✅ Videos merged successfully`
9. `📤 Uploading merged video to Supabase Storage...`
10. `✅ Merged video uploaded`

## Structure du système

### Flux de génération

```
1. Cron quotidien (18h UTC)
   ↓
2. select-daily-news
   - Analyse les articles des dernières 24h
   - Sélectionne les 6 meilleurs
   ↓
3. generate-daily-jt
   - Génère le script du JT
   - Crée la vidéo avec D-ID
   - Télécharge le jingle depuis Supabase Storage
   - Concatène jingle + vidéo D-ID avec FFmpeg
   - Upload la vidéo finale sur Supabase Storage
   ↓
4. Vidéo disponible sur /jt
```

### Stockage Supabase

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

## Personnalisation

### Changer le jingle

1. Remplacez `public/video/Jingle.mp4`
2. Exécutez : `.\scripts\upload-jt-assets.ps1`

### Changer l'image du présentateur

1. Remplacez `public/image/Gretta JT.jpg`
2. Exécutez : `.\scripts\upload-jt-assets.ps1`
3. Mettez à jour le secret Supabase :
   ```bash
   supabase secrets set JT_PRESENTER_IMAGE_URL="nouvelle_url"
   ```

### Modifier le script du JT

Éditez la fonction `generateJTScript()` dans :
`supabase/functions/generate-daily-jt/index.ts`

### Changer la voix

Modifiez `voice_id` dans `createDIDVideo()` :
```typescript
voice_id: 'fr-FR-DeniseNeural', // Voix actuelle
// Autres options :
// 'fr-FR-HenriNeural' (homme)
// 'fr-FR-EloiseNeural' (femme)
```

## Résolution de problèmes

### La vidéo ne se génère pas

1. Vérifiez les logs : `supabase functions logs generate-daily-jt`
2. Vérifiez que la clé D-ID est valide
3. Vérifiez que l'image du présentateur est accessible

### Erreur FFmpeg

Les Edge Functions Supabase incluent FFmpeg. Si erreur :
- Vérifiez que les vidéos sont au format MP4
- Vérifiez que les codecs sont compatibles (H.264)

### Le jingle ne s'affiche pas

1. Vérifiez que le bucket `jt-assets` est public
2. Vérifiez l'URL du jingle dans les logs
3. Testez l'URL directement dans un navigateur

## Documentation complète

- **Guide technique** : `docs/JT_JINGLE_INTEGRATION.md`
- **Système JT** : `docs/DAILY_JT_SYSTEM.md`
- **Guide rapide** : `docs/QUICK_START_JT.md`

## Support

Pour toute question :
1. Consultez les logs Supabase
2. Vérifiez la documentation D-ID : https://docs.d-id.com
3. Consultez la documentation Supabase : https://supabase.com/docs
