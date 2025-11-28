# 🚀 Commandes de déploiement - À copier-coller

## Étape 1 : Installer Supabase CLI (1 minute)

```bash
npm install -g supabase
```

## Étape 2 : Se connecter et lier le projet (2 minutes)

```bash
# Se connecter (ouvrira votre navigateur)
supabase login

# Lier votre projet existant
supabase link --project-ref jrlecaepyoivtplpvwoe
```

## Étape 3 : Configurer les secrets (30 secondes)

```bash
supabase secrets set D_ID_API_KEY="YmVuamFtaW4ucmlnb3VzdGVAZ21haWwuY29t:2EzsU0X9S7PWyOuI9dPBx"

supabase secrets set JT_PRESENTER_IMAGE_URL="https://jrlecaepyoivtplpvwoe.supabase.co/storage/v1/object/public/jt-assets/presenter/gretta-jt.jpg"
```

## Étape 4 : Déployer les fonctions (1 minute)

```bash
# Déployer generate-daily-jt
supabase functions deploy generate-daily-jt

# Déployer select-daily-news (si pas déjà fait)
supabase functions deploy select-daily-news
```

## Étape 5 : Vérifier que ça fonctionne

```bash
# Voir les logs en temps réel
supabase functions logs generate-daily-jt --tail
```

---

**Temps total : ~5 minutes**

C'est tout ! Une fois fait, vous n'aurez plus besoin de toucher au CLI sauf pour mettre à jour les fonctions.
