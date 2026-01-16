# Guide de Configuration - IA Veille

## 📋 Table des Matières
1. [Configuration Supabase](#configuration-supabase)
2. [Variables d'Environnement](#variables-denvironnement)
3. [Installation des Dépendances](#installation-des-dépendances)
4. [Configuration n8n](#configuration-n8n)
5. [Déploiement](#déploiement)

## 🗄️ Configuration Supabase

### 1. Créer un Projet Supabase

1. Allez sur [supabase.com](https://supabase.com)
2. Créez un nouveau projet
3. Notez votre **URL du projet** et votre **clé anon**

### 2. Exécuter le Schéma SQL

1. Dans le dashboard Supabase, allez dans **SQL Editor**
2. Copiez le contenu de `supabase/schema.sql`
3. Exécutez le script pour créer toutes les tables et les politiques RLS

### 3. Configurer l'Authentification

1. Allez dans **Authentication** > **Providers**
2. Activez **Email** (activé par défaut)
3. Optionnel : Activez **Google**, **GitHub**, etc.

### 4. Configurer le Storage (pour les images)

1. Allez dans **Storage**
2. Créez un bucket `article-images` (public)
3. Créez un bucket `user-avatars` (public)

## 🔐 Variables d'Environnement

Créez un fichier `.env.local` à la racine du projet :

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_cle_anon
SUPABASE_SERVICE_ROLE_KEY=votre_cle_service_role

# Email Service (SendGrid recommandé)
EMAIL_SERVICE_API_KEY=votre_cle_sendgrid
EMAIL_FROM=noreply@ia-veille.com

# n8n Webhooks
N8N_WEBHOOK_RSS_AGGREGATION=https://votre-n8n.com/webhook/rss
N8N_WEBHOOK_NEWSLETTER=https://votre-n8n.com/webhook/newsletter

# Analytics (optionnel)
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

## 📦 Installation des Dépendances

```bash
npm install
```

### Dépendances Principales

- **@supabase/supabase-js** : Client Supabase
- **framer-motion** : Animations (swipe Tinder)
- **lucide-react** : Icônes
- **react-hot-toast** : Notifications
- **date-fns** : Manipulation des dates

## 🤖 Configuration n8n

### Workflow 1 : Agrégation RSS

1. Créez un nouveau workflow dans n8n
2. Ajoutez un trigger **Webhook**
3. Ajoutez un node **RSS Feed Read**
4. Ajoutez un node **Supabase** pour insérer les articles
5. Configurez un **Cron** pour exécuter toutes les heures

### Workflow 2 : Newsletters Personnalisées

1. Créez un workflow avec trigger **Cron** (quotidien/hebdomadaire)
2. Récupérez les utilisateurs depuis Supabase
3. Pour chaque utilisateur :
   - Récupérez ses préférences
   - Calculez le score des articles
   - Sélectionnez les meilleurs articles
   - Envoyez l'email via SendGrid

### Workflow 3 : Podcast Audio (NotebookLM)

1. Trigger **Cron** quotidien
2. Récupérez les articles du jour
3. Générez un résumé avec l'API NotebookLM
4. Stockez l'audio dans Supabase Storage
5. Envoyez une notification aux abonnés

## 🚀 Déploiement

### Vercel (Recommandé)

```bash
# Installer Vercel CLI
npm i -g vercel

# Déployer
vercel

# Configurer les variables d'environnement dans le dashboard Vercel
```

### Variables d'Environnement Vercel

Ajoutez toutes les variables de `.env.local` dans :
**Settings** > **Environment Variables**

## 📊 Fonctionnalités Implémentées

### ✅ Phase 1 (Actuelle)
- [x] Structure de base Next.js + Tailwind
- [x] Schéma de base de données Supabase
- [x] Composant Hero avec accroche optimisée
- [x] Système de swipe Tinder pour préférences
- [x] Bannière de cookies RGPD
- [x] Types TypeScript

### 🔄 Phase 2 (À venir)
- [ ] Authentification complète
- [ ] Tableau de bord utilisateur
- [ ] Système de newsletters
- [ ] Intégration n8n
- [ ] Moteur de recommandation
- [ ] Podcast audio automatique

### 🎯 Phase 3 (Future)
- [ ] Playlist YouTube du jour
- [ ] Système de commentaires
- [ ] Partage social
- [ ] Analytics avancées
- [ ] Application mobile

## 🔍 SEO

### Schema.org

Les articles incluent automatiquement le balisage Schema.org :
- `Article`
- `NewsArticle`
- `BreadcrumbList`

### Sitemap

Généré automatiquement à `/sitemap.xml`

### Robots.txt

Configuré pour optimiser l'indexation

## 📝 Notes Importantes

1. **RLS (Row Level Security)** : Toutes les tables ont des politiques RLS activées
2. **Cookies** : Le consentement est géré conformément au RGPD
3. **Performance** : Utilisez les Edge Functions pour les opérations rapides
4. **Sécurité** : Ne jamais exposer la clé `SERVICE_ROLE_KEY` côté client

## 🆘 Support

Pour toute question :
- Documentation Supabase : https://supabase.com/docs
- Documentation Next.js : https://nextjs.org/docs
- Documentation n8n : https://docs.n8n.io
