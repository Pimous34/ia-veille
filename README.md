<<<<<<< HEAD
# 🤖 IA Veille - Plateforme de Veille Technologique IA

> **Trop d'informations sur l'IA, aucune adaptée à vos besoins réels ?**  
> IA Veille filtre le bruit pour vous livrer la veille technologique IA qui vous correspond.

![Next.js](https://img.shields.io/badge/Next.js-16.0-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38bdf8)

## ✨ Fonctionnalités Principales

### 🎯 Pour les Utilisateurs
- **Swipe Tinder** : Affinez vos préférences de veille en swipant les sujets
- **Newsletters Personnalisées** : Recevez uniquement les articles pertinents
- **Podcast Audio** : Écoutez les news du jour générées automatiquement
- **Playlist YouTube** : Vidéos sélectionnées selon vos intérêts
- **Classification Intelligente** : Articles organisés par catégories et tags
- **Moteur de Recherche Avancé** : Filtrage par date, source, catégorie

### 🔧 Pour les Administrateurs
- **Agrégation Automatique** : RSS, Twitter, API de newsletters
- **Web Scraping** : Collecte depuis blogs et sites spécialisés
- **Modération** : Interface de gestion des commentaires
- **Analytics** : Statistiques de consultation détaillées
- **Gestion des Sources** : Ajout/retrait de flux facilité

## 🏗️ Architecture Technique

### Stack Technologique

```
Frontend:  Next.js 16 + React + TypeScript + Tailwind CSS v4
Backend:   Supabase (PostgreSQL + Auth + Edge Functions)
Automation: n8n (Workflows d'agrégation et newsletters)
Email:     SendGrid / Mailgun
Analytics: Google Analytics (optionnel)
```

### Structure de la Base de Données

```sql
├── articles          # Contenu agrégé
├── sources           # Flux RSS, API, etc.
├── categories        # Classification thématique
├── user_profiles     # Profils et préférences
├── user_activity_log # Historique pour recommandations
├── saved_articles    # Articles sauvegardés
├── article_scores    # Scores de pertinence
└── newsletters       # Historique d'envoi
```

## 🚀 Démarrage Rapide

### Prérequis

- Node.js 18+
- Compte Supabase
- Compte SendGrid (pour les emails)
- n8n (optionnel, pour l'automatisation)

### Installation

```bash
# Cloner le projet
git clone https://github.com/votre-username/ia-veille.git
cd ia-veille

# Installer les dépendances
npm install

# Copier le fichier d'environnement
cp env.example .env.local

# Configurer les variables d'environnement
# Éditez .env.local avec vos clés Supabase, SendGrid, etc.

# Exécuter le schéma SQL dans Supabase
# Copiez le contenu de supabase/schema.sql dans le SQL Editor de Supabase

# Lancer le serveur de développement
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) pour voir le résultat.

## 📁 Structure du Projet

```
ia-veille/
├── src/
│   ├── app/              # Pages Next.js (App Router)
│   ├── components/       # Composants React réutilisables
│   │   ├── Navbar.tsx
│   │   ├── Hero.tsx
│   │   ├── ArticleList.tsx
│   │   ├── SwipePreferences.tsx
│   │   ├── CookieBanner.tsx
│   │   └── Footer.tsx
│   ├── lib/              # Utilitaires et clients (Supabase)
│   ├── types/            # Types TypeScript
│   └── hooks/            # Custom React hooks
├── supabase/
│   └── schema.sql        # Schéma de base de données
├── public/               # Assets statiques
└── env.example           # Template des variables d'environnement
```

## 🎨 Fonctionnalités Détaillées

### 1. Système de Swipe Tinder

Permet aux utilisateurs de définir leurs préférences de manière ludique :
- Swipe à droite = J'aime ce sujet
- Swipe à gauche = Pas intéressé
- Algorithme de recommandation basé sur ces préférences

### 2. Newsletters Personnalisées

- **Fréquence configurable** : Quotidienne, hebdomadaire, mensuelle
- **Contenu adapté** : Basé sur les préférences et l'historique
- **Résumés IA** : Articles résumés automatiquement
- **Envoi planifié** : Via n8n et SendGrid

### 3. Podcast Audio Automatique

- Génération via NotebookLM
- Résumé des actualités du jour
- Stockage dans Supabase Storage
- Notification aux abonnés

### 4. Conformité RGPD

- Bannière de cookies conforme
- Gestion des préférences utilisateur
- Politique de confidentialité
- Droit à l'oubli

## 🔐 Sécurité

- **Row Level Security (RLS)** : Activé sur toutes les tables
- **Authentification** : Gérée par Supabase Auth
- **Validation** : Côté serveur via Edge Functions
- **HTTPS** : Obligatoire en production

## 📊 SEO

### Optimisations Implémentées

- ✅ Schema.org (Article, NewsArticle)
- ✅ Meta tags Open Graph
- ✅ Twitter Cards
- ✅ Sitemap.xml automatique
- ✅ Robots.txt configuré
- ✅ Core Web Vitals optimisés
- ✅ Mobile-First responsive

### Stratégie de Contenu

- **Longue Traîne** : Ciblage de requêtes spécifiques
- **Hubs Thématiques** : Pages piliers par catégorie
- **Données Originales** : Analyses et classements exclusifs
- **Google Actualités** : Inscription prévue

## 🛠️ Scripts Disponibles

```bash
npm run dev          # Serveur de développement
npm run build        # Build de production
npm run start        # Serveur de production
npm run lint         # Vérification du code
```

## 📖 Documentation Complète

Consultez [SETUP.md](./SETUP.md) pour :
- Configuration détaillée de Supabase
- Configuration des workflows n8n
- Déploiement sur Vercel
- Gestion des variables d'environnement

## 🗺️ Roadmap

### Phase 1 (Actuelle) ✅
- [x] Structure de base Next.js + Tailwind
- [x] Schéma de base de données Supabase
- [x] Hero avec accroche optimisée
- [x] Système de swipe Tinder
- [x] Bannière de cookies RGPD
- [x] Types TypeScript

### Phase 2 (En cours) 🔄
- [ ] Authentification complète
- [ ] Tableau de bord utilisateur
- [ ] Système de newsletters
- [ ] Intégration n8n
- [ ] Moteur de recommandation
- [ ] Podcast audio automatique

### Phase 3 (Future) 🎯
- [ ] Playlist YouTube du jour
- [ ] Système de commentaires
- [ ] Partage social
- [ ] Analytics avancées
- [ ] Application mobile

## 🤝 Contribution

Les contributions sont les bienvenues ! Consultez [CONTRIBUTING.md](./CONTRIBUTING.md) pour les guidelines.

## 📄 Licence

Ce projet est sous licence MIT. Voir [LICENSE](./LICENSE) pour plus de détails.

## 📞 Support

- 📧 Email : support@ia-veille.com
- 💬 Discord : [Rejoindre la communauté](#)
- 📖 Documentation : [docs.ia-veille.com](#)

## 🙏 Remerciements

- [Next.js](https://nextjs.org)
- [Supabase](https://supabase.com)
- [Tailwind CSS](https://tailwindcss.com)
- [n8n](https://n8n.io)
- [Framer Motion](https://www.framer.com/motion)

---

**Fait avec ❤️ pour la communauté IA**
=======
# Oreegami - Veille IA & No-Code

Site web responsive pour un système de veille sur l'Intelligence Artificielle et le No-Code.

## Structure du site

- **Header** : Logo à gauche, position sticky
- **Section Vidéo** : JT News centré avec lecteur vidéo YouTube
- **Articles du JT News** : Articles cités dans le journal télévisé
- **Articles Tendances** : Articles populaires du moment

## Fonctionnalités

- Design responsive (mobile, tablette, desktop)
- Interface moderne et épurée
- Articles avec images, catégories et dates
- Navigation fluide et intuitive

## Installation

1. Placez votre logo dans le dossier racine sous le nom `logo.png`
2. Ouvrez `index.html` dans votre navigateur
3. Ou servez les fichiers avec un serveur local :
   ```bash
   # Avec Python
   python -m http.server 8000
   
   # Avec Node.js (http-server)
   npx http-server
   ```

## Personnalisation

### Changer la vidéo YouTube

Dans `index.html`, modifiez l'URL de la vidéo :
```html
<iframe 
    class="video-player"
    src="https://www.youtube.com/embed/VOTRE_VIDEO_ID" 
    ...
</iframe>
```

Ou utilisez JavaScript :
```javascript
updateVideo('VOTRE_VIDEO_ID');
```

### Modifier les articles

Éditez les tableaux `jtArticles` et `trendingArticles` dans `script.js` :

```javascript
const jtArticles = [
    {
        id: 1,
        title: "Titre de l'article",
        excerpt: "Description de l'article",
        category: "IA", // ou "No-Code"
        date: "2024-01-15",
        link: "https://url-de-l-article.com",
        image: "https://url-de-l-image.jpg"
    },
    // ...
];
```

### Personnaliser les couleurs

Modifiez les variables CSS dans `styles.css` :

```css
:root {
    --primary-color: #2563eb;
    --secondary-color: #1e40af;
    /* ... */
}
```

## Structure des fichiers

```
.
├── index.html      # Structure HTML
├── styles.css      # Styles CSS responsive
├── script.js       # Logique JavaScript
├── logo.png        # Logo (à ajouter)
└── README.md       # Documentation
```

## Notes

- Les images d'articles utilisent des URLs Unsplash par défaut (exemples)
- Remplacez-les par vos propres images ou URLs
- Le logo doit être au format PNG, JPG ou SVG
- Le site est entièrement responsive et fonctionne sur tous les appareils




>>>>>>> pimous/main
