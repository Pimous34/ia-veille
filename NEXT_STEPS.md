# 🚀 Prochaines Étapes - Déploiement JT avec Jingle

## ✅ Ce qui est fait

- [x] Clé API D-ID configurée
- [x] Image du présentateur uploadée sur Supabase Storage
- [x] Jingle vidéo uploadé sur Supabase Storage
- [x] Fonction `generate-daily-jt` modifiée pour intégrer le jingle
- [x] Scripts et documentation créés

## 📋 Ce qu'il reste à faire

### 1. Installer Supabase CLI

```bash
npm install -g supabase
```

### 2. Se connecter et lier le projet

```bash
# Se connecter à Supabase
supabase login

# Lier le projet
supabase link --project-ref jrlecaepyoivtplpvwoe
```

### 3. Configurer les secrets

```bash
# Clé API D-ID
supabase secrets set D_ID_API_KEY="YmVuamFtaW4ucmlnb3VzdGVAZ21haWwuY29t:2EzsU0X9S7PWyOuI9dPBx"

# URL de l'image du présentateur
supabase secrets set JT_PRESENTER_IMAGE_URL="https://jrlecaepyoivtplpvwoe.supabase.co/storage/v1/object/public/jt-assets/presenter/gretta-jt.jpg"
```

### 4. Déployer la fonction

```bash
# Déployer generate-daily-jt
supabase functions deploy generate-daily-jt
```

### 5. Tester le système

```bash
# Test manuel (remplacez YOUR_SERVICE_ROLE_KEY par votre clé)
curl -X POST \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  https://jrlecaepyoivtplpvwoe.supabase.co/functions/v1/select-daily-news

# Suivre les logs
supabase functions logs generate-daily-jt --tail
```

## 📊 Logs attendus lors de la génération

```
🎥 Creating video with D-ID...
Using presenter image: https://jrlecaepyoivtplpvwoe.supabase.co/storage/v1/object/public/jt-assets/presenter/gretta-jt.jpg
✅ D-ID talk created: xxx
📊 Video status: processing (attempt 1/60)
📊 Video status: processing (attempt 2/60)
...
✅ Video ready!
🎬 Downloading jingle video...
🎬 Downloading main video...
🎬 Merging videos with FFmpeg...
✅ Videos merged successfully
📤 Uploading merged video to Supabase Storage...
✅ Merged video uploaded: https://jrlecaepyoivtplpvwoe.supabase.co/storage/v1/object/public/jt-assets/videos/jt-2024-11-24.mp4
```

## 🎯 Résultat final

Une fois déployé, chaque JT généré quotidiennement à 18h UTC contiendra :

1. **Jingle d'introduction** (Jingle.mp4)
2. **Vidéo JT principale** (générée par D-ID avec Gretta JT)

La vidéo finale sera disponible sur la page `/jt` de votre application.

## 📚 Documentation de référence

- **Guide technique complet** : `docs/JT_JINGLE_INTEGRATION.md`
- **Guide de configuration** : `JT_SETUP_GUIDE.md`
- **Résumé de l'intégration** : `INTEGRATION_COMPLETE.md`
- **Système JT** : `docs/DAILY_JT_SYSTEM.md`

## 💡 Commandes utiles

```bash
# Voir tous les secrets configurés
supabase secrets list

# Voir les logs en temps réel
supabase functions logs generate-daily-jt --tail

# Redéployer après modification
supabase functions deploy generate-daily-jt

# Tester localement (si configuré)
supabase functions serve generate-daily-jt
```

## ⚠️ Points d'attention

1. **FFmpeg** : Les Edge Functions Supabase incluent FFmpeg par défaut
2. **Durée de génération** : Comptez 3-6 minutes par JT
3. **Coûts D-ID** : ~190 crédits par JT (jingle + vidéo principale)
4. **Stockage** : ~100MB par JT final sur Supabase Storage

## 🆘 En cas de problème

### Erreur lors du déploiement
```bash
# Vérifier la connexion
supabase projects list

# Vérifier les secrets
supabase secrets list
```

### Erreur lors de la génération
```bash
# Consulter les logs détaillés
supabase functions logs generate-daily-jt --tail

# Vérifier que les assets sont accessibles
# Ouvrir dans un navigateur :
# https://jrlecaepyoivtplpvwoe.supabase.co/storage/v1/object/public/jt-assets/presenter/gretta-jt.jpg
# https://jrlecaepyoivtplpvwoe.supabase.co/storage/v1/object/public/jt-assets/jingle/jingle.mp4
```

### La vidéo ne se lit pas
- Vérifier que le jingle et la vidéo D-ID utilisent le même codec (H.264)
- Consulter la section "Résolution de problèmes" dans `docs/JT_JINGLE_INTEGRATION.md`

## ✅ Checklist finale

Avant de considérer le déploiement comme terminé :

- [ ] Supabase CLI installé
- [ ] Projet lié avec `supabase link`
- [ ] Secrets configurés (D_ID_API_KEY, JT_PRESENTER_IMAGE_URL)
- [ ] Fonction `generate-daily-jt` déployée
- [ ] Test manuel effectué avec succès
- [ ] Logs vérifiés (pas d'erreur)
- [ ] Vidéo finale générée et accessible
- [ ] Vidéo visible sur la page `/jt`

---

**Bon déploiement ! 🚀**
