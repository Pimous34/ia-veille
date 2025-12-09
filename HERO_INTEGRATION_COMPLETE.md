# ✅ Intégration Hero - JT Dynamiques

## Modifications apportées

### Composant Hero.tsx mis à jour

Le composant `Hero` charge maintenant automatiquement les JT générés depuis Supabase au lieu d'afficher la vidéo statique.

#### Changements principaux :

1. **Playlist dynamique** ✅
   - Remplace la playlist statique par un chargement depuis `daily_news_videos`
   - Affiche les 5 JT les plus récents
   - Fallback sur la vidéo statique si aucun JT n'est disponible

2. **News items dynamiques** ✅
   - Les titres des JT sont affichés dans la section "News du jour"
   - Liens vers les pages détaillées de chaque JT (`/jt/{id}`)
   - Message informatif si aucun JT n'est disponible

3. **États de chargement** ✅
   - Indicateur de chargement pendant la récupération des JT
   - Gestion des erreurs
   - Message si aucun JT n'est disponible

## Fonctionnement

### Au chargement de la page :
1. Le composant charge les JT depuis Supabase
2. Filtre uniquement les JT avec `status = 'completed'`
3. Trie par date décroissante (plus récent en premier)
4. Limite à 5 JT maximum
5. Convertit les JT en format playlist pour le lecteur vidéo

### Affichage :
- **Vidéo** : Affiche le JT avec jingle intégré
- **Titre** : Affiche le titre du JT (ex: "JT IA - 24 novembre 2024")
- **Navigation** : Scroll pour passer d'un JT à l'autre
- **Liste** : Section "News du jour" avec tous les JT disponibles

## Test du système

Pour tester la génération d'un JT et voir l'intégration :

```bash
curl -X POST \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpybGVjYWVweW9pdnRwbHB2d29lIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTU3NDI4NiwiZXhwIjoyMDc3MTUwMjg2fQ.rzzfmguz5maKd2Jd9RknA9cYcbvw3MDa8Mzos-RXGvE" \
  https://jrlecaepyoivtplpvwoe.supabase.co/functions/v1/select-daily-news
```

Cette commande va :
1. Sélectionner les 6 meilleurs articles des dernières 24h
2. Générer le JT avec D-ID
3. Ajouter le jingle au début
4. Uploader la vidéo finale sur Supabase Storage
5. Enregistrer dans `daily_news_videos`
6. **Le JT apparaîtra automatiquement sur la page d'accueil !**

## Flux complet

```
Page d'accueil chargée
    ↓
Hero.tsx charge les JT depuis Supabase
    ↓
Affiche les JT dans le lecteur vidéo
    ↓
L'utilisateur peut :
  - Regarder le JT (avec jingle intégré)
  - Scroller pour voir d'autres JT
  - Cliquer sur un titre pour voir la page détaillée
```

## Fallback

Si aucun JT n'est disponible :
- **Vidéo** : Affiche `/video/video pour appli.mp4` (vidéo de démo)
- **Message** : "Aucun JT disponible pour le moment"
- **Info** : "Les JT quotidiens seront générés automatiquement chaque jour à 18h UTC"

## Prochaines étapes

1. ✅ Générer le premier JT (commande ci-dessus)
2. ✅ Vérifier qu'il apparaît sur la page d'accueil
3. ✅ Configurer le cron pour génération automatique quotidienne

---

**Intégration effectuée le** : 24 novembre 2024  
**Fichier modifié** : `src/components/Hero.tsx`  
**Statut** : ✅ Prêt à tester
